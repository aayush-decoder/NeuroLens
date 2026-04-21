export interface S3FileEntry {
  id: string;
  name: string;
  url: string;
  path: string;
  createdAt: string;
}

export interface S3Directory {
  name: string;
  files: S3FileEntry[];
}
