import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/s3";
import type { S3FileEntry, S3Directory } from "@/types/files.types";
import { auth } from "@/lib/auth";

export type { S3FileEntry, S3Directory };

export async function GET() {
  const session = await auth();

  if (!session?.user || !(session.user as { id?: string }).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  const records = await prisma.userFile.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  // Deduplicate by S3 key — keep the earliest record per key
  const seenKeys = new Set<string>();
  const uniqueRecords = records.filter(r => {
    if (seenKeys.has(r.url)) return false;
    seenKeys.add(r.url);
    return true;
  });

  const dirMap = new Map<string, S3FileEntry[]>();

  await Promise.all(uniqueRecords.map(async (r) => {
    const dir = r.path || "root";
    if (!dirMap.has(dir)) dirMap.set(dir, []);

    // r.url is now the S3 key — generate a presigned URL
    let presignedUrl: string;
    try {
      presignedUrl = await getPresignedUrl(r.url);
    } catch {
      return; // skip files that can't be signed (e.g. deleted from S3)
    }

    const name = decodeURIComponent(r.url.split("/").pop() ?? r.id);
    dirMap.get(dir)!.push({
      id: r.id,
      name,
      url: presignedUrl,
      path: dir,
      createdAt: r.createdAt.toISOString(),
    });
  }));

  const directories: S3Directory[] = Array.from(dirMap.entries()).map(
    ([name, files]) => ({ name, files })
  );

  return NextResponse.json({ directories });
}

