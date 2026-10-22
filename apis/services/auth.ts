import { defaultInstance } from "../defaultInstance";
import type {
  AuthTokens,
  ChangePasswordRequest,
  InitialPasswordRequest,
  LoginRequest,
  MeResponse,
  RefreshTokenRequest,
} from "@/types";

export const authService = {
  /** 구성원 로그인 */
  login: (body: LoginRequest) => defaultInstance.post<AuthTokens>("/auth/login", body).then((r) => r.data),

  /** 운영자 로그인 */
  loginOperator: (body: LoginRequest) =>
    defaultInstance.post<AuthTokens>("/auth/operator/login", body).then((r) => r.data),

  /** refresh token 폐기. access token이 만료돼도 호출할 수 있다. */
  logout: (body: RefreshTokenRequest) => defaultInstance.post<void>("/auth/logout", body).then(() => undefined),

  /** 로그인 사용자 (구성원·운영자 공용) */
  me: () => defaultInstance.get<MeResponse>("/auth/me").then((r) => r.data),

  /** 첫 로그인 시 초기 비밀번호 변경 */
  changeInitialPassword: (body: InitialPasswordRequest) =>
    defaultInstance.post<void>("/auth/initial-password", body).then(() => undefined),

  /** 내 정보 화면의 비밀번호 변경 */
  changePassword: (body: ChangePasswordRequest) =>
    defaultInstance.post<void>("/auth/password", body).then(() => undefined),
};
