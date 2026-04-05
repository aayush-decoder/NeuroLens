import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { NextAuthConfig } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const { auth } = NextAuth(authOptions as NextAuthConfig);
const bearerSecret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "change-me"
);

async function resolveUserId(request: Request): Promise<string | null> {
  const session = await auth();

  if (session && session.user && (session.user as { id?: string }).id) {
    return (session.user as { id: string }).id;
  }

  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(match[1], bearerSecret);
    const userId = typeof payload.sub === "string" ? payload.sub : null;

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? user.id : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

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
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESSS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

    if (!bucketName || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        {
          success: false,
          message: "S3 is not configured. Set AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID (or AWS_ACCESSS_KEY), and AWS_SECRET_ACCESS_KEY (or AWS_SECRET_KEY).",
        },
        { status: 500 },
      );
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Prepare S3 Key
    // user/<unique userid>/path/to/file.../filename.pdf
    // sanitize pathParam format just to be safe
    const cleanPath = pathParam.replace(/^\/+|\/+$/g, '');
    const key = `user/${userId}/${cleanPath}/${file.name}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Compute accessible URI
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    // Store in Postgresql DB
    await prisma.userFile.create({
      data: {
        userId: userId,
        url: s3Url,
        path: pathParam,
      },
    });

    return NextResponse.json({ success: true, url: s3Url });

  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ success: false, message: (error as Error).message || "Unknown error" }, { status: 500 });
  }
}
