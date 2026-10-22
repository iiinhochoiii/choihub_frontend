import type { ISODateString } from "./common";

export type FormFieldType = "text" | "textarea" | "number" | "date";

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  placeholder?: string;
}

export interface ApprovalForm {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: FormField[];
  /** 결재선 (순서대로 결재) */
  approverIds: string[];
  active: boolean;
  updatedAt: ISODateString;
}

export type ApprovalStepStatus = "waiting" | "pending" | "approved" | "rejected";

export interface ApprovalStep {
  approverId: string;
  status: ApprovalStepStatus;
  comment?: string;
  actedAt?: ISODateString;
}

export type ApprovalDocStatus = "in_progress" | "approved" | "rejected" | "withdrawn";

export interface ApprovalDocument {
  id: string;
  docNumber: string;
  formId: string;
  formName: string;
  title: string;
  fields: FormField[]; // 기안 당시 양식 스냅샷
  values: Record<string, string>;
  drafterId: string;
  createdAt: ISODateString;
  status: ApprovalDocStatus;
  steps: ApprovalStep[];
}

export interface ApprovalFormListParams {
  /** true면 사용 중인 양식만 */
  active?: boolean;
}

export interface ApprovalFormRequest {
  name: string;
  category: string;
  description?: string;
  /** id를 비우면 서버가 만든다. */
  fields: (Omit<FormField, "id"> & { id?: string })[];
  approverIds: string[];
}

/** pending: 내 결재 차례, drafted: 내가 기안, processed: 내가 결재 완료 */
export type ApprovalBox = "pending" | "drafted" | "processed" | "all";

export interface CreateApprovalDocRequest {
  formId: string;
  title: string;
  values: Record<string, string>;
}

export type ApprovalDecision = "approved" | "rejected";

export interface DecideRequest {
  decision: ApprovalDecision;
  comment?: string;
}

export interface PendingCountResponse {
  count: number;
}
