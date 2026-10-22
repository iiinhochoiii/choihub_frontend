import type { ISODateString } from "./common";

export interface ArchiveFolder {
  id: string;
  name: string;
  createdAt: ISODateString;
  fileCount: number;
}

export interface ArchiveFile {
  id: string;
  name: string;
  /** 폴더 이름 */
  folder: string;
  folderId: string;
  size: number; // bytes
  mimeType: string;
  uploaderId: string;
  uploadedAt: ISODateString;
  description: string;
  /** 1MB 이하로 업로드돼 내용을 내려받을 수 있는지 */
  hasContent: boolean;
}

export interface CreateFolderRequest {
  name: string;
}

export interface ArchiveFileListParams {
  folderId?: string;
  q?: string;
}

export interface UploadFileRequest {
  file: File;
  folderId: string;
  description?: string;
}
