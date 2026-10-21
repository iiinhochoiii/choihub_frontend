export type Role = "manager" | "employee";

export interface Department {
  id: string;
  name: string;
  parentId: string | null;
}

export type MemberStatus = "active" | "remote" | "away" | "leave";

export interface Member {
  id: string;
  name: string;
  email: string;
  /** 데모용 평문 비밀번호. 실제 서비스에서는 서버에서 해시로 관리해야 한다. */
  password: string;
  role: Role;
  departmentId: string;
  position: string;
  phone: string;
  extension: string;
  joinedAt: string; // YYYY-MM-DD
  birthday: string; // MM-DD
  status: MemberStatus;
  annualLeaveTotal: number;
  color: string;
  /** 초기 비밀번호로 발급된 계정이면 첫 로그인 시 비밀번호 변경을 요구한다. */
  mustChangePassword?: boolean;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm
  checkOut: string | null; // HH:mm
}

export type LeaveType = "annual" | "half_am" | "half_pm" | "sick" | "special";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  memberId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  createdAt: string; // ISO
  reviewerId?: string;
}

export type EventCategory = "meeting" | "personal" | "company" | "trip";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  startTime: string; // HH:mm (allDay면 무시)
  endTime: string;
  category: EventCategory;
  ownerId: string;
  description: string;
  /** true면 전 직원에게 공개 */
  shared: boolean;
}

export type NoticeCategory = "general" | "hr" | "event" | "system";

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  category: NoticeCategory;
  views: number;
}

export type PostCategory = "free" | "question" | "info" | "club";

export interface BoardComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  category: PostCategory;
  views: number;
  likes: string[]; // memberId 목록
  comments: BoardComment[];
}

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
  updatedAt: string;
}

export type ApprovalStepStatus = "waiting" | "pending" | "approved" | "rejected";

export interface ApprovalStep {
  approverId: string;
  status: ApprovalStepStatus;
  comment?: string;
  actedAt?: string;
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
  createdAt: string;
  status: ApprovalDocStatus;
  steps: ApprovalStep[];
}

export interface CompanyInfo {
  name: string;
  nameEn: string;
  ceo: string;
  businessNumber: string;
  corporateNumber: string;
  industry: string;
  foundedAt: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  address: string;
  workStart: string; // HH:mm
  workEnd: string; // HH:mm
  defaultAnnualLeave: number;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  createdBy: string;
  dueDate: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  /** false면 사용 중지(공사·점검 등). 새 예약을 받지 않는다. */
  active: boolean;
  inactiveReason?: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  memberId: string;
  /** 회의실이 삭제되면 기록 표시용으로 당시 이름을 남긴다. */
  roomName?: string;
}

export interface ArchiveFile {
  id: string;
  name: string;
  folder: string;
  size: number; // bytes
  mimeType: string;
  uploaderId: string;
  uploadedAt: string;
  description: string;
  /** 1MB 이하 업로드 파일만 dataURL로 보관한다. 시드 데이터는 내용이 없다. */
  dataUrl?: string;
}

export interface GroupwareData {
  version: number;
  company: CompanyInfo;
  departments: Department[];
  members: Member[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  events: CalendarEvent[];
  notices: Notice[];
  posts: Post[];
  approvalForms: ApprovalForm[];
  approvalDocs: ApprovalDocument[];
  tasks: Task[];
  rooms: Room[];
  reservations: Reservation[];
  archiveFolders: string[];
  archiveFiles: ArchiveFile[];
}

/** ChoiHub 플랫폼 운영자 */
export interface Operator {
  id: string;
  name: string;
  email: string;
  /** 데모용 평문 비밀번호 */
  password: string;
}

export type TenantStatus = "active" | "suspended";

/** 플랫폼에 등록된 회사(테넌트). 회사별 데이터는 서로 완전히 분리된다. */
export interface Tenant {
  id: string;
  status: TenantStatus;
  createdAt: string;
  data: GroupwareData;
}

export interface PlatformData {
  version: number;
  operators: Operator[];
  tenants: Tenant[];
}

export type Session =
  | { type: "member"; tenantId: string; memberId: string }
  | { type: "operator"; operatorId: string };
