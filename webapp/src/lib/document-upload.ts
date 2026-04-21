import { parseDocument } from '@/engines/documentParser';
import { ReaderFile } from '@/types/reader.types';
import { API_ROUTES } from './api';

type UploadResponse = {
  success: boolean;
  url?: string;
  message?: string;
};

async function buildReaderFile(file: File, folderPath: string | null): Promise<ReaderFile> {
  const text = await file.text();
  const paragraphs = parseDocument(text, file.name);
  return {
    id: crypto.randomUUID(),
    name: file.name.replace(/\.(txt|md)$/i, ''),
    content: paragraphs.join('\n\n'),
    folderId: folderPath,
    createdAt: Date.now(),
  };
}

async function uploadToApi(file: File, folderPath: string | null): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  // Use the folder name directly as the S3 path prefix
  formData.append('path', folderPath ?? 'root');

  const response = await fetch(API_ROUTES.upload, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const payload = (await response.json().catch(() => ({}))) as UploadResponse;

  if (!response.ok) {
    throw new Error(payload.message || 'Upload failed');
  }

  return payload;
}

export async function processUploadedFile(
  file: File,
  folderPath: string | null,
  addFile: (file: ReaderFile) => void,
) {
  const readerFile = await buildReaderFile(file, folderPath);
  addFile(readerFile);

  try {
    const uploadResult = await uploadToApi(file, folderPath);
    return { readerFile, uploadResult };
  } catch (error) {
    console.error('Document upload failed:', error);
    return { readerFile, uploadResult: null };
  }
}
