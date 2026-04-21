'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFileStore } from '@/store/fileStore';
import { API_ROUTES } from '@/lib/api';
import ReaderPage from '@/screens/ReaderPage';
import { Loader2 } from 'lucide-react';

export default function CloudReaderPage() {
  const params = useParams();
  const router = useRouter();
  const dbFileId = params.fileId as string;

  const upsertFile = useFileStore(s => s.upsertFile);
  // Watch the store directly — render ReaderPage only once the file is confirmed present
  const fileInStore = useFileStore(s => s.files.find(f => f.id === dbFileId));

  const [loading, setLoading] = useState(!fileInStore);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Already in store — nothing to do
    if (fileInStore) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(API_ROUTES.fileContent(dbFileId), { credentials: 'include' });
        if (res.status === 401) { router.replace('/sign-in'); return; }
        if (res.status === 404) { router.replace('/dashboard'); return; }
        if (!res.ok) throw new Error(`Server error ${res.status}`);

        const { content, name } = await res.json() as { content: string; name: string };

        // Parse markdown/txt into clean paragraphs before storing
        const { parseDocument } = await import('@/engines/documentParser');
        const paragraphs = parseDocument(content, name);
        const cleanContent = paragraphs.join('\n\n');

        upsertFile({
          id: dbFileId,
          name: name.replace(/\.(txt|md)$/i, ''),
          content: cleanContent,
          folderId: null,
          createdAt: Date.now(),
        });
        // Don't set loading=false here — the selector above will re-render
        // once the store update propagates, which sets fileInStore and triggers
        // the next render with loading=false naturally.
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };

    void load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbFileId]);

  // Once the store has the file, stop loading
  useEffect(() => {
    if (fileInStore) setLoading(false);
  }, [fileInStore]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <p className="text-sm">Could not load file: {error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="text-xs underline hover:text-foreground"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  if (loading || !fileInStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <ReaderPage fileId={dbFileId} />;
}
