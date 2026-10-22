"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { loginMember, loginOperator } from "./api/authApi";
import { PLATFORM_KEY } from "./api/mockDb";
import * as platformApi from "./api/platformApi";
import type { Updater } from "./api/platformApi";
import { queryKeys } from "./query/queryKeys";
import { SESSION_KEY, useSessionStore } from "./stores/sessionStore";
import type { GroupwareData, Member, Operator, PlatformData, Tenant } from "./types";

/**
 * 화면에서 쓰는 데이터·인증 훅 모음.
 * - 서버 데이터(플랫폼·회사 데이터): react-query 캐시 (lib/api)
 * - 클라이언트 전역 상태(로그인 세션): zustand (lib/stores)
 */

/** 세션 복원과 다른 탭에서의 변경 동기화. Providers에서 한 번만 호출한다. */
export function useStorageSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // localStorage는 클라이언트에서만 읽을 수 있으므로 마운트 후 복원한다.
    void useSessionStore.persist.rehydrate();

    const onStorage = (event: StorageEvent) => {
      if (event.key === PLATFORM_KEY) void queryClient.invalidateQueries({ queryKey: queryKeys.platform });
      if (event.key === SESSION_KEY) void useSessionStore.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [queryClient]);
}

function usePlatformQuery() {
  return useQuery({
    queryKey: queryKeys.platform,
    queryFn: platformApi.fetchPlatform,
    // 목업 저장소는 이 앱의 변경과 다른 탭의 storage 이벤트로만 바뀌므로 자동 재조회하지 않는다.
    staleTime: Infinity,
  });
}

/** 세션 복원과 플랫폼 데이터 로드가 모두 끝났는지 */
function useReady(): boolean {
  const hydrated = useSessionStore((s) => s.hydrated);
  const { isSuccess } = usePlatformQuery();
  return hydrated && isSuccess;
}

/**
 * 캐시를 먼저 갱신(낙관적 업데이트)한 뒤 저장한다.
 * update() 직후 이동한 화면에서도 새 데이터가 바로 보이고, updater는 한 번만 실행된다.
 * 저장에 실패하면 저장소 기준으로 다시 불러온다.
 */
function useOptimisticPlatformUpdate(save: (next: PlatformData) => Promise<PlatformData>) {
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: save,
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.platform }),
  });

  return useCallback(
    (updater: Updater<PlatformData>) => {
      const prev = queryClient.getQueryData<PlatformData>(queryKeys.platform);
      if (!prev) return;
      const next = updater(prev);
      // 진행 중인 재조회가 갱신된 캐시를 이전 값으로 덮어쓰지 않게 한다.
      void queryClient.cancelQueries({ queryKey: queryKeys.platform });
      queryClient.setQueryData(queryKeys.platform, next);
      mutate(next);
    },
    [queryClient, mutate],
  );
}

/** 운영자 화면에서 플랫폼 전체 데이터를 다룰 때 사용한다. */
export function usePlatform() {
  const { data: platform } = usePlatformQuery();
  const updatePlatform = useOptimisticPlatformUpdate(platformApi.savePlatform);
  if (!platform) throw new Error("플랫폼 데이터가 아직 로드되지 않았습니다. AdminShell 하위에서 사용하세요.");
  return { platform, updatePlatform };
}

/** 로그인한 구성원이 속한 회사 */
function useCurrentTenant(): Tenant | null {
  const { data: platform } = usePlatformQuery();
  const session = useSessionStore((s) => s.session);
  if (!platform || session?.type !== "member") return null;
  return platform.tenants.find((t) => t.id === session.tenantId) ?? null;
}

/** 로그인한 구성원 회사의 데이터 (대시보드 하위 전용). */
export function useData() {
  const tenant = useCurrentTenant();
  const tenantId = tenant?.id ?? "";
  const queryClient = useQueryClient();
  const updatePlatform = useOptimisticPlatformUpdate((next) => {
    const data = next.tenants.find((t) => t.id === tenantId)?.data;
    return data ? platformApi.saveTenantData(tenantId, data) : Promise.resolve(next);
  });
  const { mutate: reset } = useMutation({
    mutationFn: platformApi.resetPlatform,
    onSuccess: (platform) => queryClient.setQueryData(queryKeys.platform, platform),
  });

  const update = useCallback(
    (updater: Updater<GroupwareData>) =>
      updatePlatform((prev) => ({
        ...prev,
        tenants: prev.tenants.map((t) => (t.id === tenantId ? { ...t, data: updater(t.data) } : t)),
      })),
    [updatePlatform, tenantId],
  );

  if (!tenant) throw new Error("회사 데이터가 없습니다. DashboardShell 하위에서 사용하세요.");
  return { data: tenant.data, tenantId, update, reset: () => reset() };
}

interface AuthValue {
  ready: boolean;
  user: Member | null;
  tenant: Tenant | null;
  isManager: boolean;
  logout: () => void;
}

export function useAuth(): AuthValue {
  const ready = useReady();
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const tenant = useCurrentTenant();
  const user =
    session?.type === "member" ? (tenant?.data.members.find((m) => m.id === session.memberId) ?? null) : null;

  const logout = useCallback(() => setSession(null), [setSession]);

  return { ready, user, tenant, isManager: user?.role === "manager", logout };
}

/** 구성원 로그인. 실패하면 화면에 보여 줄 메시지를 담은 ApiError를 던진다. */
export function useLoginMutation() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({ mutationFn: loginMember, onSuccess: setSession });
}

/** 로그인한 사용자 (대시보드 하위 전용, 항상 non-null) */
export function useCurrentUser(): Member & { isManager: boolean } {
  const { user } = useAuth();
  if (!user) throw new Error("로그인 사용자가 없습니다. DashboardShell 하위에서 사용하세요.");
  return { ...user, isManager: user.role === "manager" };
}

interface OperatorAuthValue {
  ready: boolean;
  operator: Operator | null;
  logout: () => void;
}

export function useOperatorAuth(): OperatorAuthValue {
  const ready = useReady();
  const { data: platform } = usePlatformQuery();
  const session = useSessionStore((s) => s.session);
  const setSession = useSessionStore((s) => s.setSession);
  const operator =
    session?.type === "operator" ? (platform?.operators.find((o) => o.id === session.operatorId) ?? null) : null;

  const logout = useCallback(() => setSession(null), [setSession]);

  return { ready, operator, logout };
}

/** 운영자 로그인. 실패하면 ApiError를 던진다. */
export function useOperatorLoginMutation() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({ mutationFn: loginOperator, onSuccess: setSession });
}
