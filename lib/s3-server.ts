import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { Readable } from "stream";
import path from "path";

export async function downloadFromS3(file_Key: string, maxRetries = 3, retryDelay = 1000): Promise<string> {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const s3Client = new S3Client({
        region: "eu-north-1",
        credentials: {
          accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
        },
      });

      const params = {
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME!,
        Key: file_Key,
      };

      const command = new GetObjectCommand(params);
      const obj = await s3Client.send(command);
      
      if (!obj.Body) {
        throw new Error("No body in S3 response");
      }

      const filePath = path.join("/tmp", `downloaded_${Date.now()}.pdf`);
      const body = obj.Body as unknown as Readable;

      return new Promise<string>((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        const timeoutId = setTimeout(() => {
          fileStream.destroy();
          reject(new Error('Download timeout'));
        }, 30000); // 30 second timeout

        body.pipe(fileStream)
          .on("finish", () => {
            clearTimeout(timeoutId);
            resolve(filePath);
          })
          .on("error", (error: Error) => {
            clearTimeout(timeoutId);
            fs.unlink(filePath, () => {}); // Clean up partial file
            reject(error);
          });
      });
    } catch (error: unknown) {
      attempt++;
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        console.error("Download failed after", maxRetries, "attempts:", error);
        throw error;
      }

      // If it's a network error or timeout, wait and retry
      if (
        (error instanceof Error && error.message.includes('timeout')) ||
        (error instanceof Error && error.message.includes('network'))
      ) {
        console.log(`Retrying download (attempt ${attempt + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt)); // Exponential backoff
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw new Error('Download failed after max retries');
}

// Clean up any temporary files that may have been left behind
process.on('exit', () => {
  const tempDir = '/tmp';
  try {
    const files = fs.readdirSync(tempDir);
    files.forEach(file => {
      if (file.startsWith('downloaded_') && file.endsWith('.pdf')) {
        fs.unlinkSync(path.join(tempDir, file));
      }
    });
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
});

// Usage example:
// downloadFromS3("uploads/1693568801787chongzhisheng_resume.pdf").then(console.log).catch(console.error);