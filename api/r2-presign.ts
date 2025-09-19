import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { fileId, contentType } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!fileId) {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    const Bucket = process.env.R2_BUCKET as string;
    const Key = `images/${fileId}.webp`;
    const ContentType = contentType || 'image/webp';

    const command = new PutObjectCommand({ Bucket, Key, ContentType });
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    const base = process.env.R2_PUBLIC_BASE as string; // e.g. https://cdn.example.com
    const publicUrl = `${base}/${Key}`;

    res.status(200).json({ url, publicUrl, key: Key });
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
}


