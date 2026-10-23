import type { Session } from "@/lib/stores/sessionStore";

/**
 * 로그인한 세션 종류만 담는 쿠키 (토큰은 넣지 않는다).
 * 세션은 localStorage에 있어 서버가 볼 수 없으므로, proxy가 화면을 그리기 전에 로그인 여부로 이동시킬 때 쓴다.
 */
export const SESSION_TYPE_COOKIE = "groupware_session_type";

const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export function syncSessionTypeCookie(session: Session | null) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = session
    ? `${SESSION_TYPE_COOKIE}=${session.type}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
    : `${SESSION_TYPE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
