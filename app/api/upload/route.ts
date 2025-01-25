import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_AWS_BUCKET_NAME) {
    return NextResponse.json({ error: 'S3 bucket not configured' }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
    }

    const fileKey = `uploads/${Date.now().toString()}_${file.name.replace(/\s/g, '_')}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
      ContentDisposition: 'inline',
      CacheControl: 'max-age=31536000',
    });

    await s3.send(command);

    return NextResponse.json({
      file_key: fileKey,
      file_name: file.name,
      success: true
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 