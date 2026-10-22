import type { Credential, ISODateString } from "./common";
import type { CompanyInfo } from "./company";
import type { Member } from "./member";

export type TenantStatus = "active" | "suspended";

/** 운영 콘솔 회사 목록의 한 행 */
export interface TenantListItem {
  id: string;
  status: TenantStatus;
  createdAt: ISODateString;
  company: Pick<CompanyInfo, "name" | "email" | "businessNumber" | "ceo">;
  memberCount: number;
  /** 매니저 이메일 (등록 순) */
  managerEmails: string[];
}

export interface TenantListResponse {
  /** 검색어와 무관한 플랫폼 전체 통계 */
  stats: { total: number; active: number; suspended: number; members: number };
  items: TenantListItem[];
}

export interface TenantDetail {
  id: string;
  status: TenantStatus;
  createdAt: ISODateString;
  company: CompanyInfo;
  stats: { members: number; managers: number; departments: number };
  managers: Member[];
}

export interface ManagerAccountRequest {
  name: string;
  email: string;
  phone: string;
  /** 비우면 "매니저" */
  position?: string;
}

export interface CreateTenantRequest {
  company: CompanyInfo;
  manager: ManagerAccountRequest;
}

export interface CreateTenantResponse {
  tenant: TenantDetail;
  credential: Credential;
}

export interface AddManagerResponse {
  member: Member;
  credential: Credential;
}

export interface ResetPasswordResponse {
  credential: Credential;
}
