import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "@/lib/prisma";

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

  const config = await prisma.serviceConfig.findFirst({
    where: {
      userId,
      type: "STORAGE",
      isActive: true,
    },
  });

  if (!config) {
    throw new Error("未配置存储服务，请前往设置页面配置 MinIO 或 S3");
  }

  if (!config.endpoint || !config.bucket || !config.accessKey || !config.secretKey) {
    throw new Error("存储服务配置不完整");
  }

  const client = new S3Client({
    region: config.region ?? "us-east-1",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true,
  });

  cachedClient = client;
  cachedBucket = config.bucket;
  cacheTime = now;

  return { client, bucket: config.bucket };
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
