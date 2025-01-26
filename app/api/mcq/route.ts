import { NextResponse } from "next/server";
import { OpenAI } from "openai";
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

interface MCQOption {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface MCQResponse {
  questions: MCQOption[];
}

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
    const tempDir = path.join(os.tmpdir(), 'pdf-mcq');
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
      const queryEmbedding = await getEmbeddings("Generate multiple choice questions from this content");
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

    // First, get main topics from all content
    const topicsResponse = await openai.chat.completions.create({
      model: "gpt-4-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI that identifies key topics from educational content. Extract 5 main topics or concepts that would be good for multiple choice questions."
        },
        {
          role: "user",
          content: `Identify 5 key topics from these documents:\n\n${allSummaries.join('\n\n')}`
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const topicsContent = topicsResponse.choices[0].message.content;
    
    if (!topicsContent) {
      console.error("Invalid topics response:", topicsResponse);
      return NextResponse.json(
        { 
          error: "Failed to identify topics",
          details: "Could not extract topics from the content",
          raw_response: JSON.stringify(topicsResponse)
        },
        { status: 500 }
      );
    }
    
    const topics = topicsContent;
    console.log("Identified topics for MCQs:", topics);

    // Generate MCQs using OpenAI with content from all sources
    const response = await openai.chat.completions.create({
      model: "gpt-4-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI that generates high-quality multiple choice questions. Generate EXACTLY 5 multiple choice questions based on the given content. Focus on these key topics:\n\n${topics}\n\nFor each question:

1. The question should be clear and concise
2. Provide exactly 4 options labeled as A, B, C, and D
3. Ensure only one option is correct
4. Include a brief explanation for why the correct answer is right
5. When relevant, mention which document the information comes from

Your response must be a valid JSON string matching this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "A) First option",
      "explanation": "Explanation here"
    }
  ]
}`
        },
        {
          role: "user",
          content: `Generate 5 MCQs from these documents:\n\n${allRelevantContent.join('\n\n')}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content;
    
    // Enhanced error handling and logging
    if (!content) {
      console.error("Invalid OpenAI response:", response);
      return NextResponse.json(
        { 
          error: "Invalid response from OpenAI",
          details: "The API response did not contain the expected content",
          raw_response: JSON.stringify(response)
        },
        { status: 500 }
      );
    }

    console.log("Raw OpenAI response:", content);

    try {
      const mcqData = JSON.parse(content) as MCQResponse;
      
      // Validate MCQ data structure
      if (!mcqData.questions) {
        throw new Error("Missing questions array in MCQ response");
      }
      
      if (!Array.isArray(mcqData.questions)) {
        throw new Error("Questions must be an array");
      }
      
      if (mcqData.questions.length !== 5) {
        throw new Error(`Expected 5 questions but got ${mcqData.questions.length}`);
      }

      // Validate each question's structure
      mcqData.questions.forEach((question: MCQOption, index: number) => {
        if (!question.question || !question.options || !question.correctAnswer || !question.explanation) {
          throw new Error(`Question ${index + 1} is missing required fields`);
        }
        if (!Array.isArray(question.options) || question.options.length !== 4) {
          throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }
      });

      console.log("MCQs generated successfully");
      return NextResponse.json(mcqData);
    } catch (error) {
      console.error("Error parsing MCQ response:", error);
      return NextResponse.json(
        { 
          error: "Failed to generate valid MCQs",
          details: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in MCQ generation:", error);
    return NextResponse.json(
      { error: "Error generating MCQs" },
      { status: 500 }
    );
  } finally {
    // Clean up temporary files
    tempFiles.forEach(filePath => {
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error(`Error deleting temporary file: ${filePath}`, error);
        }
      }
    });
  }
} 