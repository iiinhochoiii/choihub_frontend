import { findMemberAccount, normalizeEmail } from "../platform";
import type { Session } from "../types";
import { mockLatency, readPlatform } from "./mockDb";

/** 화면에 그대로 보여 줄 수 있는 메시지를 담은 API 오류 */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export interface Credentials {
  email: string;
  password: string;
}

export async function loginMember({ email, password }: Credentials): Promise<Session> {
  await mockLatency();
  const platform = readPlatform();
  if (platform.operators.some((o) => normalizeEmail(o.email) === normalizeEmail(email))) {
    throw new ApiError("운영자 계정은 운영자 로그인 화면에서 로그인하세요.");
  }
  const account = findMemberAccount(platform, email);
  if (!account || account.member.password !== password) {
    throw new ApiError("이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  if (account.tenant.status === "suspended") {
    throw new ApiError("이용이 정지된 회사입니다. ChoiHub 운영팀에 문의하세요.");
  }
  return { type: "member", tenantId: account.tenant.id, memberId: account.member.id };
}

export async function loginOperator({ email, password }: Credentials): Promise<Session> {
  await mockLatency();
  const found = readPlatform().operators.find((o) => normalizeEmail(o.email) === normalizeEmail(email));
  if (!found || found.password !== password) {
    throw new ApiError("운영자 이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  return { type: "operator", operatorId: found.id };
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "잠시 후 다시 시도해 주세요.";
}
