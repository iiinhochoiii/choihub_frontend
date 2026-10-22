"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateNoticeRequest, NoticeListParams, UpdateNoticeRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { noticesService } from "@/apis/services/notices";

export function useNotices(params?: NoticeListParams) {
  return useQuery({
    queryKey: queryKeys.notices.list(params),
    queryFn: () => noticesService.getList(params),
    placeholderData: keepPreviousData,
  });
}

export function useNotice(id: string) {
  return useQuery({ queryKey: queryKeys.notices.detail(id), queryFn: () => noticesService.get(id) });
}

/** 조회수 증가. 응답의 views로 상세 캐시만 고친다(목록은 다음 조회 때 반영). */
export function useViewNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticesService.view(id),
    onSuccess: ({ views }, id) =>
      queryClient.setQueryData(queryKeys.notices.detail(id), (prev: Awaited<ReturnType<typeof noticesService.get>> | undefined) =>
        prev ? { ...prev, views } : prev,
      ),
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoticeRequest) => noticesService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notices.all }),
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateNoticeRequest }) => noticesService.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notices.all }),
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => noticesService.remove(id),
    // 상세 화면이 아직 떠 있으므로 상세 캐시는 건드리지 않는다(다시 조회하면 404). 목록만 갱신한다.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notices", "list"] }),
  });
}
