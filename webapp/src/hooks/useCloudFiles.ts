'use client';

import { useState, useEffect, useCallback } from 'react';
import { API_ROUTES } from '@/lib/api';
import type { S3Directory } from '@/types/files.types';

export function useCloudFiles() {
  const [directories, setDirectories] = useState<S3Directory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.files, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json() as { directories: S3Directory[] };
        setDirectories(data.directories);
      }
    } catch {
      // silently fail in sidebar
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetch_(); }, [fetch_]);

  return { directories, loading, refetch: fetch_ };
}
