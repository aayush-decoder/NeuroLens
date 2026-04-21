import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { S3_BUCKET, getPresignedUrl } from "@/lib/s3";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !(session.user as { id?: string }).id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pathParam = formData.get("path") as string | null;

    if (!file || !pathParam) {
        return NextResponse.json({ success: false, message: "File and path are required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const region = process.env.AWS_REGION || "us-east-1";
    const bucketName = S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESSS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

    if (!bucketName || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { success: false, message: "S3 is not configured." },
        { status: 500 },
      );
    }

    const s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const cleanPath = pathParam.replace(/^\/+|\/+$/g, '');
    const key = `user/${userId}/${cleanPath}/${file.name}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    // Store the S3 key — skipDuplicates handles re-uploads of the same file
    await prisma.userFile.createMany({
      data: [{ userId, url: key, path: pathParam }],
      skipDuplicates: true,
    });

    const presignedUrl = await getPresignedUrl(key);
    return NextResponse.json({ success: true, url: presignedUrl });

  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: (error as Error).message || "Unknown error" }, { status: 500 });
  }
}

