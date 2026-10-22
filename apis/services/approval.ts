import { defaultInstance } from "../defaultInstance";
import type {
  ApprovalBox,
  ApprovalDocument,
  ApprovalForm,
  ApprovalFormListParams,
  ApprovalFormRequest,
  CreateApprovalDocRequest,
  DecideRequest,
  PendingCountResponse,
} from "@/types";

/** 결재 양식 (조회는 전원, 관리는 매니저) */
export const approvalFormsService = {
  getList: (params?: ApprovalFormListParams) =>
    defaultInstance
      .get<ApprovalForm[]>("/approval-forms", {
        params: { active: params?.active === undefined ? undefined : String(params.active) },
      })
      .then((r) => r.data),

  create: (body: ApprovalFormRequest) =>
    defaultInstance.post<ApprovalForm>("/approval-forms", body).then((r) => r.data),

  update: (id: string, body: ApprovalFormRequest) =>
    defaultInstance.patch<ApprovalForm>(`/approval-forms/${id}`, body).then((r) => r.data),

  activate: (id: string) => defaultInstance.post<ApprovalForm>(`/approval-forms/${id}/activate`).then((r) => r.data),

  deactivate: (id: string) =>
    defaultInstance.post<ApprovalForm>(`/approval-forms/${id}/deactivate`).then((r) => r.data),

  /** 기안된 문서가 있으면 409 */
  remove: (id: string) => defaultInstance.delete<void>(`/approval-forms/${id}`).then(() => undefined),
};

/** 결재 문서 */
export const approvalDocsService = {
  getList: (box: ApprovalBox) =>
    defaultInstance.get<ApprovalDocument[]>("/approval-docs", { params: { box } }).then((r) => r.data),

  /** 내 결재 차례인 문서 수 */
  getPendingCount: () =>
    defaultInstance.get<PendingCountResponse>("/approval-docs/pending-count").then((r) => r.data),

  /** 기안자·결재선·매니저만 볼 수 있다. */
  get: (id: string) => defaultInstance.get<ApprovalDocument>(`/approval-docs/${id}`).then((r) => r.data),

  create: (body: CreateApprovalDocRequest) =>
    defaultInstance.post<ApprovalDocument>("/approval-docs", body).then((r) => r.data),

  /** 현재 단계 결재자의 승인·반려 */
  decide: (id: string, body: DecideRequest) =>
    defaultInstance.post<ApprovalDocument>(`/approval-docs/${id}/decide`, body).then((r) => r.data),

  /** 아무도 결재하지 않은 문서만 기안자가 회수할 수 있다. */
  withdraw: (id: string) =>
    defaultInstance.post<ApprovalDocument>(`/approval-docs/${id}/withdraw`).then((r) => r.data),
};
