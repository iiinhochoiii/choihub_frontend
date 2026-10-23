import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { syncSessionTypeCookie } from "@/lib/sessionCookie";

export const SESSION_KEY = "groupware:session";

/** 로그인 세션. 사용자 정보는 GET /auth/me로 받고, 여기에는 토큰만 둔다. */
export interface Session {
  type: "member" | "operator";
  accessToken: string;
  /** access token이 만료되면 이 토큰으로 두 토큰을 새로 받는다(1회용). */
  refreshToken: string;
}

interface SessionState {
  session: Session | null;
  /** localStorage에서 세션을 복원했는지. 복원 전에는 로그인 여부를 판단하지 않는다. */
  hydrated: boolean;
  setSession: (session: Session | null) => void;
}

/**
 * 로그인 세션 전역 스토어.
 * SSR 결과와 첫 클라이언트 렌더가 어긋나지 않도록 자동 복원을 끄고,
 * 마운트 후 useStorageSync에서 rehydrate()를 호출한다.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      setSession: (session) => {
        syncSessionTypeCookie(session);
        set({ session });
      },
    }),
    {
      name: SESSION_KEY,
      // 목업 시절의 세션({ tenantId, memberId })은 토큰이 없으므로 버린다.
      version: 1,
      migrate: () => ({ session: null }),
      storage: createJSONStorage(() => localStorage),
      partialize: ({ session }) => ({ session }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        // 쿠키가 생기기 전에 로그인했거나 다른 탭에서 세션이 바뀐 경우에도 쿠키를 맞춘다.
        syncSessionTypeCookie(state?.session ?? null);
        useSessionStore.setState({ hydrated: true });
      },
    },
  ),
);
