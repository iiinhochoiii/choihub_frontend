import { z } from "zod";

export const FOLDER_NAME_MAX = 30;
export const FILE_DESCRIPTION_MAX = 200;
/** 서버 업로드 상한(50MB). 넘으면 서버가 413으로 거절한다. */
export const MAX_UPLOAD_FILE_SIZE = 50 * 1024 * 1024;

/** SSR에서는 File이 없을 수 있어 instanceof 대신 직접 검사한다. */
const isFile = (value: unknown): value is File => typeof File !== "undefined" && value instanceof File;

export const uploadSchema = z.object({
  file: z
    .custom<File>(isFile, "업로드할 파일을 선택하세요.")
    .refine((file) => !isFile(file) || file.size <= MAX_UPLOAD_FILE_SIZE, "50MB 이하 파일만 업로드할 수 있습니다."),
  // 서버 필드 이름(folderId)과 맞춰 서버 검증 오류를 그대로 옮길 수 있게 한다.
  folderId: z.string().min(1, "폴더를 선택하세요."),
  description: z.string().trim().max(FILE_DESCRIPTION_MAX),
});

export type UploadFormValues = z.infer<typeof uploadSchema>;

/** 폴더 추가. 중복 검사를 위해 기존 폴더 이름 목록으로 스키마를 만든다(서버도 중복을 검사한다). */
export function createFolderSchema(existing: string[]) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, "폴더 이름을 입력하세요.")
      .max(FOLDER_NAME_MAX)
      .refine((name) => !existing.includes(name), "이미 있는 폴더 이름입니다."),
  });
}

export type FolderFormValues = z.infer<ReturnType<typeof createFolderSchema>>;
