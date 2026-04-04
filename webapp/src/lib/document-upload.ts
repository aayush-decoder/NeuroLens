import { parseDocument } from '@/engines/documentParser';
import { ReaderFile } from '@/types/reader.types';
import { API_ROUTES } from './api';
import { generateUniqueFileName } from '@/engines/persistenceEngine';

type UploadResponse = {
  success: boolean;
  url?: string;
  message?: string;
};

function buildReaderFile(file: File, folderId: string | null, existingNames: { fileNames: string[]; folderNames: string[] } | null = null): Promise<ReaderFile> {
  return file.text().then((text) => {
    const paragraphs = parseDocument(text, file.name);
    let fileName = file.name.replace(/\.(txt|md)$/i, '');

    // Check for naming conflicts with folders
    if (existingNames) {
      const folderNameExists = existingNames.folderNames.some(fn => fn.toLowerCase() === fileName.toLowerCase());
      if (folderNameExists) {
        // Append a suffix to avoid conflict
        fileName = `${fileName} (file)`;
      }

      // Check for duplicate file names in the same folder and generate unique name if needed
      fileName = generateUniqueFileName(fileName, existingNames.fileNames);
    }

    return {
      id: crypto.randomUUID(),
      name: fileName,
      content: paragraphs.join('\n\n'),
      folderId,
      createdAt: Date.now(),
    };
  });
}

async function uploadToApi(file: File, folderId: string | null): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', folderId ?? 'root');

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
  folderId: string | null,
  addFile: (file: ReaderFile) => void,
  existingNames: { fileNames: string[]; folderNames: string[] } | null = null,
) {
  const readerFile = await buildReaderFile(file, folderId, existingNames);
  addFile(readerFile);

  try {
    const uploadResult = await uploadToApi(file, folderId);
    return { readerFile, uploadResult };
  } catch (error) {
    console.error('Document upload failed:', error);
    return { readerFile, uploadResult: null };
  }
}