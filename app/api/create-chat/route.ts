import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chats } from "@/lib/db/schema";
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
export const maxDuration = 300;

export async function POST(req: Request) {
  let tempFilePath: string | null = null;
  
  try {
    const { fileKey, fileName } = await req.json();

    if (!fileKey || !fileName) {
      return NextResponse.json(
        { error: "File key and name are required" },
        { status: 400 }
      );
    }

    // Create a new chat in the database
    const [newChat] = await db
      .insert(chats)
      .values({
        fileKey,
        pdfName: fileName,
        pdfUrl: fileKey,
        userId: "1", // Default user ID
        createdAt: new Date(),
      })
      .returning();

    if (!newChat?.id) {
      return NextResponse.json(
        { error: "Failed to create chat" },
        { status: 500 }
      );
    }

    // Download and process the PDF
    const tempDir = path.join(os.tmpdir(), 'pdf-chat');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    tempFilePath = path.join(tempDir, `${Date.now()}-${path.basename(fileKey)}`);
    
    // Download the file and get the temp file path
    tempFilePath = await downloadFromS3(fileKey);
    if (!tempFilePath || !fs.existsSync(tempFilePath)) {
      throw new Error("Could not download file from S3");
    }

    console.log("File downloaded from S3:", tempFilePath);

    // Load and process the PDF
    const loader = new PDFLoader(tempFilePath);
    const pages = await loader.load();

    console.log("PDF loaded, number of pages:", pages.length);

    // Combine all page content
    const fullContent = pages
      .map(page => page.pageContent.trim())
      .filter(content => content.length > 0)
      .join("\n\n");

    // Split the text into chunks with smaller size and more overlap for better context
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,    // Increased chunk size for better context
      chunkOverlap: 200,  // Increased overlap to maintain context between chunks
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],  // Custom separators for better splitting
    });

    const documents = await splitter.splitDocuments([
      new Document({ pageContent: fullContent, metadata: { source: fileKey } })
    ]);

    console.log("Document split into chunks:", documents.length);

    // Get embeddings for the chunks
    const vectors = await Promise.all(
      documents.map(async (doc, index) => {
        const embedding = await getEmbeddings(doc.pageContent);
        return {
          id: `${fileKey}-${index}`,
          values: embedding,
          metadata: {
            text: doc.pageContent,
            source: fileKey,
            pageNumber: Math.floor(index / 2) + 1, // Approximate page number
          },
        };
      })
    );

    console.log("Embeddings generated for chunks");

    // Store vectors in Pinecone with namespace based on file
    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
    const pineconeIndex = client.Index("notchy");
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
    
    // Delete existing vectors for this file if any
    try {
      await namespace.deleteAll();
    } catch {
      console.log("No existing vectors to delete");
    }

    // Upload new vectors in batches
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await namespace.upsert(batch);
      console.log(`Uploaded batch ${i / batchSize + 1} of ${Math.ceil(vectors.length / batchSize)}`);
    }

    console.log("Vectors stored in Pinecone");

    return NextResponse.json({ 
      chatId: newChat.id,
      message: "Chat created and document processed successfully" 
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        // Also try to remove the temp directory if it's empty
        const tempDir = path.dirname(tempFilePath);
        if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
          fs.rmdirSync(tempDir);
        }
      } catch (error) {
        console.error("Error deleting temporary file:", error);
      }
    }
  }
} 