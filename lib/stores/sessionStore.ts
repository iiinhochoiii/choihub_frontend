import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Session } from "../types";

export const SESSION_KEY = "groupware:session";

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
      setSession: (session) => set({ session }),
    }),
    {
      name: SESSION_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ session }) => ({ session }),
      skipHydration: true,
      onRehydrateStorage: () => () => useSessionStore.setState({ hydrated: true }),
    },
  ),
);
