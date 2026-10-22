import type { Member } from "./member";
import type { TenantStatus } from "./admin";

export interface LoginRequest {
  email: string;
  password: string;
}

/** 로그인·재발급 응답 */
export interface AuthTokens {
  /** API 호출용 JWT (짧은 만료) */
  accessToken: string;
  /** access token 재발급용 (긴 만료, 1회용) */
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

/** ChoiHub 플랫폼 운영자 */
export interface Operator {
  id: string;
  name: string;
  email: string;
}

export type MeResponse =
  | { type: "member"; member: Member; tenant: { id: string; status: TenantStatus } }
  | { type: "operator"; operator: Operator };

/** 첫 로그인 시 초기 비밀번호 변경 */
export interface InitialPasswordRequest {
  password: string;
  confirm: string;
}

/** 내 정보 화면의 비밀번호 변경 */
export interface ChangePasswordRequest {
  currentPassword: string;
  nextPassword: string;
  confirmPassword: string;
}
