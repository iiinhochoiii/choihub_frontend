import { createId } from "./id";
import { createSeedData, DATA_VERSION } from "./seed";
import type { ApprovalForm, CompanyInfo, GroupwareData, Member, PlatformData, Tenant } from "./types";

/** 저장 데이터 형식이나 데모 시드가 바뀌면 올린다. 다른 버전의 저장 데이터는 새 시드로 초기화된다. */
export const PLATFORM_VERSION = 3;

export const DEMO_OPERATOR = { email: "ops@choihub.example", password: "password" } as const;

const AVATAR_COLORS = ["#3b5bdb", "#d6336c", "#0ca678", "#f76707", "#ae3ec9", "#1c7ed6", "#e8590c", "#2b8a3e"];

export function pickAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/** 헷갈리는 글자(0/O, 1/l/I)를 뺀 10자리 초기 비밀번호 */
export function generatePassword(length = 10): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 로그인 ID는 플랫폼 전체에서 유일해야 한다 (어느 회사 계정인지 이메일로 찾기 때문). */
export function isEmailTaken(platform: PlatformData, email: string, exceptMemberId?: string): boolean {
  const target = normalizeEmail(email);
  return (
    platform.operators.some((o) => normalizeEmail(o.email) === target) ||
    platform.tenants.some((t) =>
      t.data.members.some((m) => m.id !== exceptMemberId && normalizeEmail(m.email) === target),
    )
  );
}

export function isBusinessNumberTaken(platform: PlatformData, businessNumber: string, exceptTenantId?: string): boolean {
  const target = businessNumber.trim();
  return platform.tenants.some((t) => t.id !== exceptTenantId && t.data.company.businessNumber === target);
}

export function findMemberAccount(platform: PlatformData, email: string) {
  const target = normalizeEmail(email);
  for (const tenant of platform.tenants) {
    const member = tenant.data.members.find((m) => normalizeEmail(m.email) === target);
    if (member) return { tenant, member };
  }
  return null;
}

function createDefaultForms(approverId: string): ApprovalForm[] {
  const updatedAt = new Date().toISOString();
  const expenseId = createId("form");
  const proposalId = createId("form");
  return [
    {
      id: expenseId,
      name: "지출결의서",
      category: "재무",
      description: "업무 관련 비용 지출 후 정산을 요청합니다.",
      fields: [
        { id: `${expenseId}_1`, label: "지출일자", type: "date", required: true },
        { id: `${expenseId}_2`, label: "지출금액(원)", type: "number", required: true },
        { id: `${expenseId}_3`, label: "지출내역", type: "textarea", required: true },
      ],
      approverIds: [approverId],
      active: true,
      updatedAt,
    },
    {
      id: proposalId,
      name: "업무 품의서",
      category: "일반",
      description: "업무 진행에 대한 사전 승인을 요청합니다.",
      fields: [
        { id: `${proposalId}_1`, label: "시행 예정일", type: "date", required: true },
        { id: `${proposalId}_2`, label: "품의 내용", type: "textarea", required: true },
      ],
      approverIds: [approverId],
      active: true,
      updatedAt,
    },
  ];
}

export interface ManagerAccountInput {
  name: string;
  email: string;
  phone: string;
  position: string;
  password: string;
  mustChangePassword: boolean;
}

/**
 * 운영자가 회사 계정을 발급할 때 호출한다.
 * 매니저 계정 1개와 기본 부서·결재 양식이 들어 있는 회사 데이터를 만든다.
 */
export function createTenant(company: CompanyInfo, manager: ManagerAccountInput): Tenant {
  const departmentId = createId("dept");
  const managerMember: Member = {
    id: createId("m"),
    name: manager.name.trim(),
    email: manager.email.trim(),
    password: manager.password,
    role: "manager",
    departmentId,
    position: manager.position.trim() || "매니저",
    phone: manager.phone.trim(),
    extension: "",
    joinedAt: new Date().toISOString().slice(0, 10),
    birthday: "",
    status: "active",
    annualLeaveTotal: company.defaultAnnualLeave,
    color: pickAvatarColor(0),
    mustChangePassword: manager.mustChangePassword,
  };

  const data: GroupwareData = {
    version: DATA_VERSION,
    company,
    departments: [{ id: departmentId, name: "경영지원", parentId: null }],
    members: [managerMember],
    attendance: [],
    leaveRequests: [],
    events: [],
    notices: [],
    posts: [],
    approvalForms: createDefaultForms(managerMember.id),
    approvalDocs: [],
    tasks: [],
    rooms: [],
    reservations: [],
    archiveFolders: ["전사 공용"],
    archiveFiles: [],
  };

  return { id: createId("t"), status: "active", createdAt: new Date().toISOString(), data };
}

export function createPlatformSeed(): PlatformData {
  return {
    version: PLATFORM_VERSION,
    operators: [{ id: "op1", name: "ChoiHub 운영자", email: DEMO_OPERATOR.email, password: DEMO_OPERATOR.password }],
    tenants: [{ id: "t1", status: "active", createdAt: "2024-01-15T09:00:00.000Z", data: createSeedData() }],
  };
}
