"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { queryKeys } from "./queryKeys";
import { authService } from "@/apis/services/auth";
import type { ChangePasswordRequest, InitialPasswordRequest, LoginRequest, Member, Operator, TenantStatus } from "@/types";
import { type Session, SESSION_KEY, useSessionStore } from "@/lib/stores/sessionStore";

/**
 * 로그인·세션 훅 모음.
 * - 토큰: zustand 세션 스토어(localStorage에 보관)
 * - 로그인 사용자 정보: GET /auth/me (react-query 캐시)
 * - 도메인 데이터: apis/queries의 훅
 */

/** 세션 복원, 다른 탭과의 세션 동기화, 로그아웃 시 캐시 정리. Providers에서 한 번만 호출한다. */
export function useStorageSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // localStorage는 클라이언트에서만 읽을 수 있으므로 마운트 후 복원한다.
    void useSessionStore.persist.rehydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_KEY) void useSessionStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);

    // 로그아웃·refresh token 만료로 세션이 사라지면 이전 사용자의 데이터를 캐시에서 지운다.
    const unsubscribe = useSessionStore.subscribe((state, prev) => {
      if (prev.session && !state.session) queryClient.clear();
    });

    return () => {
      window.removeEventListener("storage", onStorage);
      unsubscribe();
    };
  }, [queryClient]);
}

/**
 * 로그인 사용자 조회. 구성원·운영자가 세션 저장소를 함께 쓰므로, 화면 쪽(type)과 같은 종류의 세션일 때만 호출한다.
 * (예: 운영자 세션이 남아 있어도 구성원 로그인 화면에서는 /auth/me를 부르지 않는다.)
 */
function useMeQuery(type: Session["type"]) {
  const active = useSessionStore((s) => s.session?.type === type);
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authService.me,
    enabled: active,
    staleTime: 5 * 60 * 1000,
    // 401은 인터셉터가 재발급·로그아웃까지 처리하므로 다시 시도하지 않는다.
    retry: false,
  });
}

/** 세션 복원과 로그인 사용자 조회가 끝났는지. 해당 종류의 세션이 없으면 복원만 끝나면 된다. */
function useSessionReady(type: Session["type"]) {
  const hydrated = useSessionStore((s) => s.hydrated);
  const active = useSessionStore((s) => s.session?.type === type);
  const me = useMeQuery(type);
  return {
    me: active ? me.data : undefined,
    ready: hydrated && (!active || !me.isPending),
    error: active ? me.error : null,
    retry: () => void me.refetch(),
  };
}

/** 로그아웃: 서버의 refresh token을 폐기하고(실패해도 무시) 세션을 지운다. */
export function useLogout() {
  const setSession = useSessionStore((s) => s.setSession);
  return useCallback(() => {
    const refreshToken = useSessionStore.getState().session?.refreshToken;
    if (refreshToken) void authService.logout({ refreshToken }).catch(() => undefined);
    setSession(null);
  }, [setSession]);
}

interface AuthValue {
  ready: boolean;
  /** /auth/me를 불러오지 못한 경우(서버 연결 실패 등) */
  error: Error | null;
  retry: () => void;
  user: Member | null;
  tenant: { id: string; status: TenantStatus } | null;
  isManager: boolean;
  logout: () => void;
}

export function useAuth(): AuthValue {
  const { me, ready, error, retry } = useSessionReady("member");
  const logout = useLogout();
  const member = me?.type === "member" ? me : null;

  return {
    ready,
    error,
    retry,
    user: member?.member ?? null,
    tenant: member?.tenant ?? null,
    isManager: member?.member.role === "manager",
    logout,
  };
}

/** 로그인한 사용자 (대시보드 하위 전용, 항상 non-null) */
export function useCurrentUser(): Member & { isManager: boolean } {
  const { user } = useAuth();
  if (!user) throw new Error("로그인 사용자가 없습니다. DashboardShell 하위에서 사용하세요.");
  return { ...user, isManager: user.role === "manager" };
}

interface OperatorAuthValue {
  ready: boolean;
  error: Error | null;
  retry: () => void;
  operator: Operator | null;
  logout: () => void;
}

export function useOperatorAuth(): OperatorAuthValue {
  const { me, ready, error, retry } = useSessionReady("operator");
  const logout = useLogout();
  return { ready, error, retry, operator: me?.type === "operator" ? me.operator : null, logout };
}

/**
 * 로그인 성공: 남아 있던 이전 세션(예: 운영자로 로그인한 채 구성원 로그인)의 refresh token을 폐기하고,
 * 이전 사용자의 캐시를 비운 뒤 토큰을 저장한다. 사용자 정보는 /auth/me로 다시 받는다.
 */
function useLoginWith(type: Session["type"], login: (body: LoginRequest) => ReturnType<typeof authService.login>) {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: login,
    onSuccess: async (tokens) => {
      const previous = useSessionStore.getState().session;
      if (previous) void authService.logout({ refreshToken: previous.refreshToken }).catch(() => undefined);
      queryClient.clear();
      setSession({ type, ...tokens });
      // 화면 이동 전에 사용자 정보를 받아 두어 셸이 로딩 없이 바로 그려지게 한다.
      await queryClient.prefetchQuery({ queryKey: queryKeys.auth.me, queryFn: authService.me });
    },
  });
}

/** 구성원 로그인. 실패하면 화면에 보여 줄 메시지를 담은 ApiError를 던진다. */
export function useLoginMutation() {
  return useLoginWith("member", authService.login);
}

/** 운영자 로그인. 실패하면 ApiError를 던진다. */
export function useOperatorLoginMutation() {
  return useLoginWith("operator", authService.loginOperator);
}

/** 첫 로그인 시 초기 비밀번호 변경. 성공하면 mustChangePassword가 풀린 사용자 정보를 다시 받는다. */
export function useChangeInitialPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: InitialPasswordRequest) => authService.changeInitialPassword(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

/** 내 정보 화면의 비밀번호 변경. 현재 비밀번호 확인은 서버가 한다. */
export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => authService.changePassword(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}
