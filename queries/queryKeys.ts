import type {
  ApprovalBox,
  ApprovalFormListParams,
  ArchiveFileListParams,
  EventListParams,
  LeaveListParams,
  NoticeListParams,
  PostListParams,
  TaskListParams,
} from "@/types";

/**
 * react-query 캐시 키. 도메인 단위 키(예: notices.all)로 무효화하면 그 아래 목록·상세가 함께 다시 조회된다.
 */
export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
  },
  admin: {
    all: ["admin"] as const,
    tenants: (q?: string) => ["admin", "tenants", q ?? ""] as const,
    tenant: (id: string) => ["admin", "tenant", id] as const,
  },
  company: ["company"] as const,
  departments: ["departments"] as const,
  members: {
    all: ["members"] as const,
    list: ["members", "list"] as const,
    detail: (id: string) => ["members", "detail", id] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    today: ["attendance", "today"] as const,
    myMonth: (month: string) => ["attendance", "me", month] as const,
    team: (date?: string) => ["attendance", "team", date ?? "today"] as const,
  },
  leave: {
    all: ["leave"] as const,
    mine: ["leave", "mine"] as const,
    balance: ["leave", "balance"] as const,
    list: (params?: LeaveListParams) => ["leave", "list", params ?? {}] as const,
  },
  events: {
    all: ["events"] as const,
    list: (params?: EventListParams) => ["events", "list", params ?? {}] as const,
  },
  notices: {
    all: ["notices"] as const,
    list: (params?: NoticeListParams) => ["notices", "list", params ?? {}] as const,
    detail: (id: string) => ["notices", "detail", id] as const,
  },
  posts: {
    all: ["posts"] as const,
    list: (params?: PostListParams) => ["posts", "list", params ?? {}] as const,
    detail: (id: string) => ["posts", "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    list: (params?: TaskListParams) => ["tasks", "list", params ?? {}] as const,
  },
  approvalForms: {
    all: ["approvalForms"] as const,
    list: (params?: ApprovalFormListParams) => ["approvalForms", "list", params ?? {}] as const,
  },
  approvalDocs: {
    all: ["approvalDocs"] as const,
    list: (box: ApprovalBox) => ["approvalDocs", "list", box] as const,
    detail: (id: string) => ["approvalDocs", "detail", id] as const,
    pendingCount: ["approvalDocs", "pendingCount"] as const,
  },
  rooms: ["rooms"] as const,
  reservations: {
    all: ["reservations"] as const,
    byDate: (date: string) => ["reservations", "date", date] as const,
    mine: ["reservations", "mine"] as const,
  },
  archive: {
    all: ["archive"] as const,
    folders: ["archive", "folders"] as const,
    files: (params?: ArchiveFileListParams) => ["archive", "files", params ?? {}] as const,
  },
};
