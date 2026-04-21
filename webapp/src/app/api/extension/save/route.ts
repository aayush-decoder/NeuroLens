import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { S3_BUCKET } from "@/lib/s3";

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "change-me"
);

export async function POST(req: Request) {
  try {
    // 1. Authenticate via token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    let payload;
    try {
      const { payload: verified } = await jwtVerify(token, secret);
      payload = verified;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = payload.sub as string;

    // 2. Parse body
    const body = await req.json();
    const { url = "unknown-url", title = "Untitled", text = "", revisionMarkdown = "", conceptSvg = "" } = body;

    const region = process.env.AWS_REGION || "us-east-1";
    const bucketName = S3_BUCKET;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESSS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY;

    if (!bucketName || !accessKeyId || !secretAccessKey) {
      return NextResponse.json({ success: false, message: "S3 is not configured." }, { status: 500 });
    }

    const s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // We extract the domain name for the folder structure
    let domain = "unknown_domain";
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      // ignore
    }

    // Prepare content buffers
    const readTextBuffer = Buffer.from(text || " ", "utf-8");
    // Combine revision md + concept svg conceptually or as an interconnected markdown document
    const revisionBuffer = Buffer.from(
      `# ${title}\n\n${revisionMarkdown}\n\n## Concept Map\n\n\n${conceptSvg}`, 
      "utf-8"
    );

    // Sanitize filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timeStamp = Date.now();
    
    // Path structure mirroring user/... logic
    const readTextKey = `user/${userId}/${domain}/${safeTitle}-${timeStamp}.txt`;
    const revisionKey = `user/${userId}/${domain}/${safeTitle}-${timeStamp}-revision.md`;

    // 3. Upload to S3
    await Promise.all([
      s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: readTextKey,
          Body: readTextBuffer,
          ContentType: "text/plain",
        })
      ),
      s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: revisionKey,
          Body: revisionBuffer,
          ContentType: "text/markdown",
        })
      )
    ]);

    const targetUrlTxt = `https://${bucketName}.s3.${region}.amazonaws.com/${readTextKey}`;
    const targetUrlMd = `https://${bucketName}.s3.${region}.amazonaws.com/${revisionKey}`;

    // 4. Save S3 keys — skip duplicates (unique constraint enforced at DB level)
    await prisma.userFile.createMany({
      data: [
        { userId, url: readTextKey, path: domain },
        { userId, url: revisionKey, path: domain },
      ],
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, files: [targetUrlTxt, targetUrlMd] });

  } catch (err: unknown) {
    const error = err as Error;
    console.error("[extension/save] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to save data" }, { status: 500 });
  }
}

