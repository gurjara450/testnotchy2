import { OpenAI } from "openai";
import { db } from "@/lib/db";
import { chats, messages as dbMessages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { Message } from 'ai';
import { StreamingTextResponse, OpenAIStream } from 'ai';
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { downloadFromS3 } from "@/lib/s3-server";
import { getEmbeddings } from "@/lib/embeddings";
import { Pinecone } from "@pinecone-database/pinecone";
import { convertToAscii } from "@/lib/utils";
import { Document } from "langchain/document";
import fs from 'fs';
import path from 'path';
import os from 'os';

// Change to Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const tempFiles: string[] = [];
  
  try {
    const body = await req.json();
    
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { messages, fileKey, fileKeys } = body;
    const chatId = body.chatId || body.id;

    // Handle both single fileKey and array of fileKeys
    const fileKeysToProcess = fileKeys || (fileKey ? [fileKey] : []);

    // Validation checks...
    if (!messages) {
      return NextResponse.json(
        { error: "Messages field is missing in request body" },
        { status: 400 }
      );
    }

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages must be an array" },
        { status: 400 }
      );
    }

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array cannot be empty" },
        { status: 400 }
      );
    }

    // Validate message format
    const invalidMessage = messages.find(
      msg => !msg.content || typeof msg.content !== 'string' || !msg.role
    );
    if (invalidMessage) {
      return NextResponse.json(
        { 
          error: "Invalid message format",
          details: "Each message must have 'content' (string) and 'role' fields"
        },
        { status: 400 }
      );
    }

    let parsedChatId: number;
    
    // If no chatId but fileKeys exist, create a new chat
    if (!chatId && fileKeysToProcess.length > 0) {
      try {
        const result = await db.insert(chats)
          .values({
            fileKey: fileKeysToProcess[0], // Use first file key as reference
            pdfName: fileKeysToProcess.map((key: string) => key.split('/').pop()).join(', '),
            pdfUrl: fileKeysToProcess[0],
            userId: '1',
            createdAt: new Date(),
          })
          .returning({ insertedId: chats.id });
        
        parsedChatId = result[0].insertedId;
      } catch (error) {
        console.error("Error creating new chat:", error);
        return NextResponse.json(
          { error: "Failed to create new chat" },
          { status: 500 }
        );
      }
    } else {
      if (!chatId) {
        return NextResponse.json(
          { error: "chatId or fileKeys are required" },
          { status: 400 }
        );
      }
      
      parsedChatId = Number(chatId);
      if (isNaN(parsedChatId)) {
        return NextResponse.json(
          { error: "chatId must be a valid number" },
          { status: 400 }
        );
      }
    }

    const lastMessage = messages[messages.length - 1];

    // Fetch the chat from the database
    const _chats = await db.select().from(chats).where(eq(chats.id, parsedChatId));
    if (_chats.length !== 1) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Process all PDFs
    const tempDir = path.join(os.tmpdir(), 'pdf-chat');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Array to store all document chunks
    let allDocuments: Document[] = [];
    const allSummaries: string[] = [];

    // Process each PDF file
    for (const fileKeyToUse of fileKeysToProcess) {
      const tempFilePath = path.join(tempDir, `${Date.now()}-${path.basename(fileKeyToUse)}`);
      tempFiles.push(tempFilePath);
      
      // Download and process each PDF
      const downloadedPath = await downloadFromS3(fileKeyToUse);
      if (!downloadedPath || !fs.existsSync(downloadedPath)) {
        console.error(`Could not download file from S3: ${fileKeyToUse}`);
        continue;
      }

      console.log(`Processing file: ${fileKeyToUse}`);
      
      // Load and process the PDF
      const loader = new PDFLoader(downloadedPath);
      const pages = await loader.load();

      console.log(`PDF loaded, number of pages:`, pages.length);

      // Combine all page content
      const fullContent = pages
        .map(page => page.pageContent.trim())
        .filter(content => content.length > 0)
        .join("\n\n");

      allSummaries.push(`Summary of ${fileKeyToUse.split('/').pop()}:\n${fullContent.slice(0, 500)}...`);

      // Split the text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
      });

      const documents = await splitter.splitDocuments([
        new Document({ pageContent: fullContent, metadata: { source: fileKeyToUse } })
      ]);

      allDocuments = [...allDocuments, ...documents];
    }

    console.log("Total document chunks:", allDocuments.length);

    // Get embeddings for all chunks
    const vectors = await Promise.all(
      allDocuments.map(async (doc, index) => {
        const embedding = await getEmbeddings(doc.pageContent);
        return {
          id: `${doc.metadata.source}-${index}`,
          values: embedding,
          metadata: {
            text: doc.pageContent,
            source: doc.metadata.source,
          },
        };
      })
    );

    // Store vectors in Pinecone
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = client.Index("notchy");

    // Store vectors for each source in its namespace
    for (const fileKey of fileKeysToProcess) {
      const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
      const fileVectors = vectors.filter(v => v.metadata.source === fileKey);
      if (fileVectors.length > 0) {
        await namespace.upsert(fileVectors);
      }
    }

    // Get relevant chunks from all sources
    const queryEmbedding = await getEmbeddings(lastMessage.content);
    let allRelevantContent: string[] = [];

    for (const fileKey of fileKeysToProcess) {
      const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
      const queryResponse = await namespace.query({
        vector: queryEmbedding,
        topK: 3, // Reduced from 5 to avoid too much context
        includeMetadata: true,
      });

      const relevantContent = queryResponse.matches
        .map(match => {
          const source = typeof match.metadata?.source === 'string' 
            ? match.metadata.source.split('/').pop() 
            : 'Unknown';
          const text = match.metadata?.text as string;
          return `[From ${source}]: ${text}`;
        })
        .filter(Boolean);

      allRelevantContent = [...allRelevantContent, ...relevantContent];
    }

    // Save user message to database
    try {
      await db.insert(dbMessages).values({
        chatId: parsedChatId,
        content: lastMessage.content,
        role: "user",
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving user message:", error);
    }

    // Generate response from OpenAI with streaming
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant analyzing multiple PDF documents. Here's what you know about the documents:

${allSummaries.join('\n\n')}

When answering questions, use the following relevant context from all documents:
${allRelevantContent.join('\n\n')}

If asked about the topic or content of the PDFs, use the summaries above to provide an overview. For specific questions, use the relevant context provided. Always mention which document you're referencing in your answers. If you can't find the answer in any of the documents, say so.`,
        } as ChatCompletionMessageParam,
        ...messages.map((message: Message) => ({
          role: message.role === "user" ? "user" : "assistant",
          content: message.content,
        } as ChatCompletionMessageParam)),
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Create a stream transformer to save the response
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        try {
          await db.insert(dbMessages).values({
            chatId: parsedChatId,
            content: completion,
            role: "assistant",
            createdAt: new Date(),
          });
        } catch (error) {
          console.error("Error saving assistant message:", error);
        }
      },
    });

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Cleanup temporary files
    for (const tempFile of tempFiles) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch (error) {
        console.error("Error cleaning up temp file:", error);
      }
    }
  }
}