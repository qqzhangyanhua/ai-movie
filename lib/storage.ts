import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";

let cachedClient: S3Client | null = null;
let cachedBucket: string | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getStorageClient(
  userId: string
): Promise<{ client: S3Client; bucket: string }> {
  const now = Date.now();

  if (cachedClient && cachedBucket && now - cacheTime < CACHE_TTL) {
    return { client: cachedClient, bucket: cachedBucket };
  }

  // ServiceConfig 已废弃，使用环境变量
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const region = process.env.S3_REGION || "us-east-1";

  if (!endpoint || !bucket || !accessKey || !secretKey) {
    throw new Error("未配置存储服务环境变量 (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY)");
  }

  const client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    forcePathStyle: true,
  });

  cachedClient = client;
  cachedBucket = bucket;
  cacheTime = now;

  return { client, bucket };
}

export async function getUploadUrl(
  userId: string,
  key: string,
  contentType: string
): Promise<string> {
  const { client, bucket } = await getStorageClient(userId);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function getDownloadUrl(
  userId: string,
  key: string
): Promise<string> {
  const { client, bucket } = await getStorageClient(userId);
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function deleteObject(userId: string, key: string): Promise<void> {
  const { client, bucket } = await getStorageClient(userId);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export async function uploadFile(
  userId: string,
  key: string,
  file: Buffer,
  contentType: string
): Promise<string> {
  const { client, bucket } = await getStorageClient(userId);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );
  return key;
}

export function getStorageKey(
  userId: string,
  type: string,
  filename: string
): string {
  const timestamp = Date.now();
  const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  return `${userId}/${type}/${timestamp}-${sanitized}`;
}
