import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/s3";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";/**
 * GET /api/files/[id]/content
 * Fetches the file content from S3 server-side (no CORS) and returns it as plain text.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  const record = await prisma.userFile.findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const presignedUrl = await getPresignedUrl(record.url);
    const s3Res = await fetch(presignedUrl);
    if (!s3Res.ok) {
      return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
    }

    const content = await s3Res.text();
    const name = decodeURIComponent(record.url.split("/").pop() ?? id);

    return NextResponse.json({ content, name });
  } catch (err) {
    console.error("[files/content]", err);
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
  }
}
