import type { Credential } from "./common";

export type Role = "manager" | "employee";

export type MemberStatus = "active" | "remote" | "away" | "leave";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string;
  position: string;
  phone: string;
  extension: string;
  joinedAt: string; // YYYY-MM-DD
  birthday: string; // MM-DD
  status: MemberStatus;
  /** 매니저와 본인에게만 내려온다. 다른 직원의 값은 없다. */
  annualLeaveTotal?: number;
  color: string;
  /** 초기 비밀번호로 발급된 계정이면 첫 로그인 시 비밀번호 변경을 요구한다. */
  mustChangePassword: boolean;
}

export interface CreateMemberRequest {
  name: string;
  email: string;
  departmentId: string;
  position: string;
  role: Role;
  status: MemberStatus;
  phone: string;
  extension?: string;
  joinedAt: string;
  birthday?: string;
  annualLeaveTotal: number;
}

export interface CreateMemberResponse {
  member: Member;
  credential: Credential;
}

/** 보낸 필드만 바꾼다. */
export type UpdateMemberRequest = Partial<CreateMemberRequest>;

/** 내 정보 화면: 연락처와 근무 상태만 바꿀 수 있다. */
export interface UpdateProfileRequest {
  phone?: string;
  extension?: string;
  status?: MemberStatus;
}
