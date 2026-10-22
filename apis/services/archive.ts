import { defaultInstance } from "../defaultInstance";
import type {
  ArchiveFile,
  ArchiveFileListParams,
  ArchiveFolder,
  CreateFolderRequest,
  UploadFileRequest,
} from "@/types";

export const archiveService = {
  getFolders: () => defaultInstance.get<ArchiveFolder[]>("/archive/folders").then((r) => r.data),

  /** 매니저 */
  createFolder: (body: CreateFolderRequest) =>
    defaultInstance.post<ArchiveFolder>("/archive/folders", body).then((r) => r.data),

  getFiles: (params?: ArchiveFileListParams) =>
    defaultInstance
      .get<ArchiveFile[]>("/archive/files", { params: { ...params, q: params?.q || undefined } })
      .then((r) => r.data),

  /** multipart 업로드. 1MB 이하 파일만 내용을 보관한다. */
  upload: ({ file, folderId, description }: UploadFileRequest) => {
    const form = new FormData();
    form.append("file", file);
    form.append("folderId", folderId);
    if (description) form.append("description", description);
    return defaultInstance.post<ArchiveFile>("/archive/files", form).then((r) => r.data);
  },

  /** 파일 내용 (hasContent인 파일만) */
  download: (id: string) =>
    defaultInstance.get<Blob>(`/archive/files/${id}/download`, { responseType: "blob" }).then((r) => r.data),

  /** 업로더 또는 매니저 */
  remove: (id: string) => defaultInstance.delete<void>(`/archive/files/${id}`).then(() => undefined),
};
