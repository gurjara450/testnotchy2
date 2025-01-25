import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import md5 from "md5";
import { Document, RecursiveCharacterTextSplitter } from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "@/lib/embeddings";
import { convertToAscii } from "./utils";

export const getPineconeClient = (): Pinecone => {
  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

// Define the return type for clarity
export async function loadS3IntoPinecone(fileKey: string): Promise<Document[]> {
  try {
    console.log("Downloading file from S3 into the file system...");
    const file_Name = await downloadFromS3(fileKey);
    if (!file_Name) {
      throw new Error("Could not download from S3");
    }

    console.log("Loading PDF into memory:", file_Name);
    const loader = new PDFLoader(file_Name);
    const pages = (await loader.load()) as PDFPage[];

    console.log("Preparing documents from PDF pages...");
    const documents = await Promise.all(pages.map(prepareDocument));

    console.log("Embedding documents...");
    const vectors = await Promise.all(documents.flat().map(embedDocument));

    console.log("Uploading vectors to Pinecone...");
    const client = getPineconeClient();
    const pineconeIndex = await client.index("notchy"); // Ensure index name is correct
    const namespace = pineconeIndex.namespace(convertToAscii(fileKey));

    await namespace.upsert(vectors);
    console.log("Vectors successfully inserted into Pinecone");

    // Return the array of processed documents
    return documents.flat();

  } catch (error) {
    console.error("Error in loadS3IntoPinecone:", error);
    throw error;
  }
}

// Updated function to ensure type compatibility for metadata fields
async function embedDocument(doc: Document): Promise<PineconeRecord> {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text as string, // Cast to string if RecordMetadataValue expects it
        pageNumber: doc.metadata.pageNumber as number, // Cast to number if RecordMetadataValue expects it
      },
    };
  } catch (error) {
    console.error("Error embedding document:", error);
    throw error;
  }
}

// Utility to truncate strings based on byte size
export const truncateStringByBytes = (str: string, bytes: number): string => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

// Function to prepare each document with splitting logic
async function prepareDocument(page: PDFPage): Promise<Document[]> {
  const { pageContent, metadata } = page;
  const cleanedContent = pageContent.replace(/\n/g, "");

  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent: cleanedContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(cleanedContent, 36000),
      },
    }),
  ]);

  return docs;
}

