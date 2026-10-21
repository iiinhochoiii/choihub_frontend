"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPlatformSeed, findMemberAccount, normalizeEmail, PLATFORM_VERSION } from "./platform";
import type { GroupwareData, Member, Operator, PlatformData, Session, Tenant } from "./types";

/**
 * 백엔드가 붙기 전까지 쓰는 목업 스토어.
 * 플랫폼 전체(운영자 + 회사별 데이터)를 localStorage에 저장하며,
 * API가 준비되면 이 파일의 구현만 교체하면 된다.
 */
const PLATFORM_KEY = "groupware:platform";
const SESSION_KEY = "groupware:session";
/** 단일 회사 시절 저장 키. 더 이상 읽지 않으며 발견되면 지운다. */
const LEGACY_DATA_KEY = "groupware:data";

type Updater<T> = (prev: T) => T;

interface StoreContextValue {
  platform: PlatformData | null;
  session: Session | null;
  ready: boolean;
  updatePlatform: (updater: Updater<PlatformData>) => void;
  resetPlatform: () => void;
  setSession: (session: Session | null) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/** 저장된 데이터에 새로 추가된 필드의 기본값을 채운다. */
function normalizeTenantData(data: GroupwareData): GroupwareData {
  return {
    ...data,
    rooms: data.rooms.map((room) => ({ ...room, active: room.active ?? true })),
  };
}

function normalizePlatform(platform: PlatformData): PlatformData {
  return {
    ...platform,
    tenants: platform.tenants.map((t) => ({ ...t, data: normalizeTenantData(t.data) })),
  };
}

/**
 * 현재 버전으로 저장된 데이터만 불러온다.
 * 이전 버전(데모 회사·서비스명 변경 전 데이터 포함)이나 손상된 데이터는 새 시드로 초기화한다.
 */
function readPlatform(): PlatformData {
  try {
    const raw = localStorage.getItem(PLATFORM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlatformData;
      if (parsed.version === PLATFORM_VERSION) return normalizePlatform(parsed);
    }
  } catch {
    // 손상된 데이터는 시드로 대체한다.
  }
  return createPlatformSeed();
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    if (raw.startsWith("{")) return JSON.parse(raw) as Session;
    // 단일 회사 시절에는 memberId 문자열만 저장했다.
    return { type: "member", tenantId: "t1", memberId: raw };
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (error) {
    console.warn(`[store] ${key} 저장 실패`, error);
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<PlatformData | null>(null);
  const [session, setSessionState] = useState<Session | null>(null);

  useEffect(() => {
    // localStorage는 클라이언트에서만 읽을 수 있으므로 마운트 후 동기화한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlatform(readPlatform());
    setSessionState(readSession());
    writeStorage(LEGACY_DATA_KEY, null);

    const onStorage = (event: StorageEvent) => {
      if (event.key === PLATFORM_KEY) setPlatform(readPlatform());
      if (event.key === SESSION_KEY) setSessionState(readSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (platform) writeStorage(PLATFORM_KEY, JSON.stringify(platform));
  }, [platform]);

  useEffect(() => {
    if (platform) writeStorage(SESSION_KEY, session ? JSON.stringify(session) : null);
  }, [platform, session]);

  const updatePlatform = useCallback((updater: Updater<PlatformData>) => {
    setPlatform((prev) => (prev ? updater(prev) : prev));
  }, []);

  const resetPlatform = useCallback(() => setPlatform(createPlatformSeed()), []);

  const value = useMemo(
    () => ({
      platform,
      session,
      ready: platform !== null,
      updatePlatform,
      resetPlatform,
      setSession: setSessionState,
    }),
    [platform, session, updatePlatform, resetPlatform],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore는 StoreProvider 안에서만 사용할 수 있습니다.");
  return ctx;
}

/** 운영자 화면에서 플랫폼 전체 데이터를 다룰 때 사용한다. */
export function usePlatform() {
  const { platform, updatePlatform } = useStore();
  if (!platform) throw new Error("플랫폼 데이터가 아직 로드되지 않았습니다. AdminShell 하위에서 사용하세요.");
  return { platform, updatePlatform };
}

/** 로그인한 구성원이 속한 회사 */
function useCurrentTenant(): Tenant | null {
  const { platform, session } = useStore();
  if (!platform || session?.type !== "member") return null;
  return platform.tenants.find((t) => t.id === session.tenantId) ?? null;
}

/** 로그인한 구성원 회사의 데이터 (대시보드 하위 전용). */
export function useData() {
  const { updatePlatform, resetPlatform } = useStore();
  const tenant = useCurrentTenant();
  if (!tenant) throw new Error("회사 데이터가 없습니다. DashboardShell 하위에서 사용하세요.");
  const tenantId = tenant.id;

  const update = useCallback(
    (updater: Updater<GroupwareData>) =>
      updatePlatform((prev) => ({
        ...prev,
        tenants: prev.tenants.map((t) => (t.id === tenantId ? { ...t, data: updater(t.data) } : t)),
      })),
    [updatePlatform, tenantId],
  );

  return { data: tenant.data, tenantId, update, reset: resetPlatform };
}

type LoginResult = { ok: true } | { ok: false; message: string };

interface AuthValue {
  ready: boolean;
  user: Member | null;
  tenant: Tenant | null;
  isManager: boolean;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
}

export function useAuth(): AuthValue {
  const { platform, session, ready, setSession } = useStore();
  const tenant = useCurrentTenant();
  const user =
    session?.type === "member" ? (tenant?.data.members.find((m) => m.id === session.memberId) ?? null) : null;

  const login = useCallback<AuthValue["login"]>(
    (email, password) => {
      if (!platform) return { ok: false, message: "잠시 후 다시 시도해 주세요." };
      if (platform.operators.some((o) => normalizeEmail(o.email) === normalizeEmail(email))) {
        return { ok: false, message: "운영자 계정은 운영자 로그인 화면에서 로그인하세요." };
      }
      const account = findMemberAccount(platform, email);
      if (!account || account.member.password !== password) {
        return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." };
      }
      if (account.tenant.status === "suspended") {
        return { ok: false, message: "이용이 정지된 회사입니다. ChoiHub 운영팀에 문의하세요." };
      }
      setSession({ type: "member", tenantId: account.tenant.id, memberId: account.member.id });
      return { ok: true };
    },
    [platform, setSession],
  );

  const logout = useCallback(() => setSession(null), [setSession]);

  return { ready, user, tenant, isManager: user?.role === "manager", login, logout };
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
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
}

export function useOperatorAuth(): OperatorAuthValue {
  const { platform, session, ready, setSession } = useStore();
  const operator =
    session?.type === "operator" ? (platform?.operators.find((o) => o.id === session.operatorId) ?? null) : null;

  const login = useCallback<OperatorAuthValue["login"]>(
    (email, password) => {
      const found = platform?.operators.find((o) => normalizeEmail(o.email) === normalizeEmail(email));
      if (!found || found.password !== password) {
        return { ok: false, message: "운영자 이메일 또는 비밀번호가 올바르지 않습니다." };
      }
      setSession({ type: "operator", operatorId: found.id });
      return { ok: true };
    },
    [platform, setSession],
  );

  const logout = useCallback(() => setSession(null), [setSession]);

  return { ready, operator, login, logout };
}
