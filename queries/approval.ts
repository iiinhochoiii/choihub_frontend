"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ApprovalBox,
  ApprovalFormListParams,
  ApprovalFormRequest,
  CreateApprovalDocRequest,
  DecideRequest,
} from "@/types";
import { queryKeys } from "./queryKeys";
import { approvalDocsService, approvalFormsService } from "@/apis/services/approval";

// ───────── 양식 ─────────

export function useApprovalForms(params?: ApprovalFormListParams) {
  return useQuery({
    queryKey: queryKeys.approvalForms.list(params),
    queryFn: () => approvalFormsService.getList(params),
  });
}

function useFormMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.approvalForms.all }),
  });
}

export function useCreateApprovalForm() {
  return useFormMutation((body: ApprovalFormRequest) => approvalFormsService.create(body));
}

export function useUpdateApprovalForm() {
  return useFormMutation(({ id, body }: { id: string; body: ApprovalFormRequest }) =>
    approvalFormsService.update(id, body),
  );
}

export function useSetApprovalFormActive() {
  return useFormMutation(({ id, active }: { id: string; active: boolean }) =>
    active ? approvalFormsService.activate(id) : approvalFormsService.deactivate(id),
  );
}

export function useDeleteApprovalForm() {
  return useFormMutation((id: string) => approvalFormsService.remove(id));
}

// ───────── 문서 ─────────

export function useApprovalDocs(box: ApprovalBox) {
  return useQuery({ queryKey: queryKeys.approvalDocs.list(box), queryFn: () => approvalDocsService.getList(box) });
}

export function useApprovalDoc(id: string) {
  return useQuery({ queryKey: queryKeys.approvalDocs.detail(id), queryFn: () => approvalDocsService.get(id) });
}

/** 사이드바 배지 등: 내 결재 차례인 문서 수 */
export function useApprovalPendingCount() {
  return useQuery({
    queryKey: queryKeys.approvalDocs.pendingCount,
    queryFn: approvalDocsService.getPendingCount,
    select: (data) => data.count,
  });
}

/** 문서 변경 후: 응답으로 상세 캐시를 바꾸고 목록·대기 건수는 다시 조회한다. */
function useDocMutation<TVariables>(mutationFn: (variables: TVariables) => ReturnType<typeof approvalDocsService.get>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (doc) => {
      queryClient.setQueryData(queryKeys.approvalDocs.detail(doc.id), doc);
      void queryClient.invalidateQueries({ queryKey: ["approvalDocs", "list"] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.approvalDocs.pendingCount });
    },
  });
}

export function useCreateApprovalDoc() {
  return useDocMutation((body: CreateApprovalDocRequest) => approvalDocsService.create(body));
}

export function useDecideApprovalDoc() {
  return useDocMutation(({ id, body }: { id: string; body: DecideRequest }) => approvalDocsService.decide(id, body));
}

export function useWithdrawApprovalDoc() {
  return useDocMutation((id: string) => approvalDocsService.withdraw(id));
}
