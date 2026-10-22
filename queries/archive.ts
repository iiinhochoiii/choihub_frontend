"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ArchiveFile, ArchiveFileListParams, CreateFolderRequest, UploadFileRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { archiveService } from "@/apis/services/archive";

export function useArchiveFolders() {
  return useQuery({ queryKey: queryKeys.archive.folders, queryFn: archiveService.getFolders });
}

export function useArchiveFiles(params?: ArchiveFileListParams) {
  return useQuery({
    queryKey: queryKeys.archive.files(params),
    queryFn: () => archiveService.getFiles(params),
    placeholderData: keepPreviousData,
  });
}

/** 폴더 파일 수도 바뀌므로 자료실 전체를 다시 조회한다. */
function useArchiveMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.archive.all }),
  });
}

export function useCreateArchiveFolder() {
  return useArchiveMutation((body: CreateFolderRequest) => archiveService.createFolder(body));
}

export function useUploadArchiveFile() {
  return useArchiveMutation((body: UploadFileRequest) => archiveService.upload(body));
}

export function useDeleteArchiveFile() {
  return useArchiveMutation((id: string) => archiveService.remove(id));
}

/** 파일을 내려받아 브라우저 저장 대화상자를 띄운다. */
export function useDownloadArchiveFile() {
  return useMutation({
    mutationFn: async (file: Pick<ArchiveFile, "id" | "name">) => {
      const blob = await archiveService.download(file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}
