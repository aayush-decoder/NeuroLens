import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: (process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESSS_KEY) as string,
    secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY) as string,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME as string;

/**
 * Generate a pre-signed GET URL for an S3 object key.
 * @param key      S3 object key (e.g. "user/abc/root/file.txt")
 * @param expiresIn seconds until expiry (default 5 minutes)
 */
export async function getPresignedUrl(key: string, expiresIn = 300): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

export { s3 };
