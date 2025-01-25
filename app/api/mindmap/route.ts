import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai-edge";
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

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  const tempFiles: string[] = [];

  try {
    const { fileKey, fileKeys } = await req.json();
    
    // Handle both single fileKey and array of fileKeys
    const fileKeysToProcess = fileKeys || (fileKey ? [fileKey] : []);

    if (fileKeysToProcess.length === 0) {
      return NextResponse.json(
        { error: "No file keys provided" },
        { status: 400 }
      );
    }

    console.log("Processing files:", fileKeysToProcess);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(os.tmpdir(), 'pdf-mindmap');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Array to store all document chunks and summaries
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
    const allRelevantContent: string[] = [];

    for (const fileKey of fileKeysToProcess) {
      const namespace = pineconeIndex.namespace(convertToAscii(fileKey));
      const queryEmbedding = await getEmbeddings("Create a mind map from this content");
      const queryResponse = await namespace.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
      });

      const relevantContent = queryResponse.matches
        .map(match => {
          const source = typeof match.metadata?.source === 'string' 
            ? match.metadata.source.split('/').pop() || 'Unknown'
            : 'Unknown';
          const text = match.metadata?.text as string;
          return `[From ${source}]: ${text}`;
        })
        .filter(Boolean);

      allRelevantContent.push(...relevantContent);
    }

    // First, get main topics and structure from all content
    const structureResponse = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that analyzes content and identifies the main topic and key subtopics for a mind map. Extract the main topic and 4-6 key subtopics that would create a good hierarchical structure."
        },
        {
          role: "user",
          content: `Analyze these documents and identify the main topic and key subtopics for a mind map:\n\n${allSummaries.join('\n\n')}`
        }
      ],
      temperature: 0.3,
    });

    const structureData = await structureResponse.json();
    const structure = structureData.choices?.[0]?.message?.content || "";

    console.log("Identified structure for mind map");

    // Generate mind map using OpenAI with content from all sources
    const response = await openai.createChatCompletion({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI that creates educational mind maps. Create a hierarchical mind map from the given text, using this structure as a guide:\n\n${structure}\n\nThe mind map should follow this exact format:
{
  "title": "Main Topic",
  "rootNode": {
    "id": "root",
    "text": "Central Concept",
    "children": [
      {
        "id": "unique-id-1",
        "text": "Main Branch 1",
        "note": "Additional information about this concept (include source document when relevant)",
        "color": "#hexcolor",
        "children": [
          {
            "id": "unique-id-2",
            "text": "Sub-concept 1",
            "note": "Detailed explanation (include source document when relevant)"
          }
        ]
      }
    ]
  }
}`
        },
        {
          role: "user",
          content: `Create a mind map from these documents:\n\n${allRelevantContent.join('\n\n')}`,
        },
      ],
      temperature: 0.5,
    });

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: "Invalid response from OpenAI" },
        { status: 500 }
      );
    }

    try {
      const mindMapData = JSON.parse(data.choices[0].message.content);
      if (!mindMapData.title || !mindMapData.rootNode) {
        return NextResponse.json(
          { error: "Invalid mind map format received from OpenAI" },
          { status: 500 }
        );
      }
      console.log("Mind map generated successfully");
      return NextResponse.json(mindMapData);
    } catch (error) {
      console.error("Error parsing mind map response:", error);
      return NextResponse.json(
        { error: "Failed to parse mind map response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in mind map generation:", error);
    return NextResponse.json(
      { error: "Error generating mind map" },
      { status: 500 }
    );
  } finally {
    // Clean up temporary files
    for (const tempFilePath of tempFiles) {
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (error) {
          console.error(`Error deleting temporary file: ${tempFilePath}`, error);
        }
      }
    }
  }
} 