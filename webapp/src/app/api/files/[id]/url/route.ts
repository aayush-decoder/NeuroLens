import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/s3";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";/**
 * GET /api/files/[id]/url
 * Returns a fresh pre-signed URL for a single file owned by the authenticated user.
 * Accepts optional ?expiresIn=<seconds> query param (max 3600).
 */
export async function GET(
  req: Request,
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

  const { searchParams } = new URL(req.url);
  const expiresIn = Math.min(Number(searchParams.get("expiresIn") ?? 300), 3600);

  try {
    const url = await getPresignedUrl(record.url, expiresIn);
    return NextResponse.json({ url, expiresIn });
  } catch (err) {
    console.error("[files/url] signing failed:", err);
    return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });
  }
}
