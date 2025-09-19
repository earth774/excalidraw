import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';

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
    const { keys } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
      res.status(400).json({ error: 'keys is required' });
      return;
    }

    const Bucket = process.env.R2_BUCKET as string;
    const Objects = keys.map((Key: string) => ({ Key }));
    await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects } }));
    res.status(200).json({ ok: true, deleted: keys.length });
  } catch (e: unknown) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete objects' });
  }
}


