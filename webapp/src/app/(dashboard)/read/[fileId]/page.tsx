'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import ReaderPage from '@/screens/ReaderPage';

export default function Page() {
  const params = useParams();
  const fileId = params.fileId as string;

  return <ReaderPage fileId={fileId} />;
}
