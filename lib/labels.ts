import type {
  ApprovalDocStatus,
  ApprovalStepStatus,
  EventCategory,
  FormFieldType,
  LeaveType,
  MemberStatus,
  NoticeCategory,
  PostCategory,
  RequestStatus,
  Role,
  TaskPriority,
  TaskStatus,
} from "@/types";

/** Badge 컴포넌트의 tone 값 */
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

interface LabelTone {
  label: string;
  tone: Tone;
}

export const ROLE_LABELS: Record<Role, string> = {
  manager: "매니저",
  employee: "직원",
};

export const MEMBER_STATUS: Record<MemberStatus, LabelTone> = {
  active: { label: "근무중", tone: "success" },
  remote: { label: "재택", tone: "info" },
  away: { label: "외근", tone: "warning" },
  leave: { label: "휴가", tone: "neutral" },
};

export const LEAVE_TYPES: Record<LeaveType, { label: string; days: number | null }> = {
  annual: { label: "연차", days: null },
  half_am: { label: "오전 반차", days: 0.5 },
  half_pm: { label: "오후 반차", days: 0.5 },
  sick: { label: "병가", days: null },
  special: { label: "경조휴가", days: null },
};

export const REQUEST_STATUS: Record<RequestStatus, LabelTone> = {
  pending: { label: "승인 대기", tone: "warning" },
  approved: { label: "승인", tone: "success" },
  rejected: { label: "반려", tone: "danger" },
};

export const EVENT_CATEGORIES: Record<EventCategory, { label: string; color: string }> = {
  meeting: { label: "회의", color: "#3b5bdb" },
  personal: { label: "개인", color: "#0f9f6e" },
  company: { label: "전사", color: "#d6336c" },
  trip: { label: "출장/외근", color: "#e8590c" },
};

export const NOTICE_CATEGORIES: Record<NoticeCategory, LabelTone> = {
  general: { label: "일반", tone: "neutral" },
  hr: { label: "인사", tone: "primary" },
  event: { label: "행사", tone: "success" },
  system: { label: "시스템", tone: "warning" },
};

export const POST_CATEGORIES: Record<PostCategory, LabelTone> = {
  free: { label: "자유", tone: "neutral" },
  question: { label: "질문", tone: "info" },
  info: { label: "정보공유", tone: "primary" },
  club: { label: "동호회", tone: "success" },
};

export const FORM_FIELD_TYPES: Record<FormFieldType, string> = {
  text: "한 줄 텍스트",
  textarea: "여러 줄 텍스트",
  number: "숫자",
  date: "날짜",
};

export const APPROVAL_DOC_STATUS: Record<ApprovalDocStatus, LabelTone> = {
  in_progress: { label: "진행중", tone: "primary" },
  approved: { label: "승인 완료", tone: "success" },
  rejected: { label: "반려", tone: "danger" },
  withdrawn: { label: "회수", tone: "neutral" },
};

export const APPROVAL_STEP_STATUS: Record<ApprovalStepStatus, LabelTone> = {
  waiting: { label: "대기", tone: "neutral" },
  pending: { label: "결재중", tone: "warning" },
  approved: { label: "승인", tone: "success" },
  rejected: { label: "반려", tone: "danger" },
};

export const TASK_STATUS: Record<TaskStatus, LabelTone> = {
  todo: { label: "할 일", tone: "neutral" },
  in_progress: { label: "진행중", tone: "primary" },
  review: { label: "검토", tone: "warning" },
  done: { label: "완료", tone: "success" },
};

export const TASK_PRIORITY: Record<TaskPriority, LabelTone> = {
  low: { label: "낮음", tone: "neutral" },
  medium: { label: "보통", tone: "info" },
  high: { label: "높음", tone: "danger" },
};
