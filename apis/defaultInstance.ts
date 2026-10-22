import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useSessionStore } from "@/lib/stores/sessionStore";
import type { ApiErrorBody, AuthTokens } from "@/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

/** 화면에 그대로 보여 줄 수 있는 메시지를 담은 API 오류 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP 상태 코드. 서버에 닿지 못했으면 0 */
    readonly status: number,
    /** 필드 경로("company.email" 등) → 메시지. react-hook-form setError에 그대로 쓴다. */
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_MESSAGE = "잠시 후 다시 시도해 주세요.";
const NETWORK_ERROR = "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!(error instanceof AxiosError)) return new ApiError(DEFAULT_MESSAGE, 0);
  if (!error.response) return new ApiError(NETWORK_ERROR, 0);
  const body = error.response.data as Partial<ApiErrorBody> | undefined;
  const message = typeof body?.message === "string" ? body.message : DEFAULT_MESSAGE;
  return new ApiError(message, error.response.status, body?.errors ?? {});
}

export function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : DEFAULT_MESSAGE;
}

/** 모든 서비스가 공유하는 axios 인스턴스 */
export const defaultInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

/** 토큰 재발급 전용. defaultInstance의 인터셉터를 타지 않게 따로 둔다. */
const refreshClient = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 });

/** 동시에 여러 요청이 401을 받아도 재발급은 한 번만 한다. */
let refreshing: Promise<string | null> | null = null;

/**
 * refresh token으로 두 토큰을 새로 받아 세션에 저장하고 새 access token을 돌려준다.
 * refresh token이 만료·폐기됐으면 세션을 지우고(로그아웃) null을 돌려준다. 각 셸이 로그인 화면으로 보낸다.
 * 서버에 닿지 못한 경우에는 세션을 유지한 채 오류를 던진다.
 */
function refreshAccessToken(): Promise<string | null> {
  refreshing ??= (async () => {
    const { session, setSession } = useSessionStore.getState();
    if (!session) return null;
    try {
      const { data } = await refreshClient.post<AuthTokens>("/auth/refresh", { refreshToken: session.refreshToken });
      setSession({ ...session, ...data });
      return data.accessToken;
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 0) throw apiError;
      // 다른 탭이 먼저 재발급해 세션이 바뀌었다면 그 토큰을 쓴다.
      const latest = useSessionStore.getState().session;
      if (latest && latest.refreshToken !== session.refreshToken) return latest.accessToken;
      setSession(null);
      return null;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

defaultInstance.interceptors.request.use((config) => {
  const token = useSessionStore.getState().session?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

defaultInstance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = error instanceof AxiosError ? (error.config as RetriableConfig | undefined) : undefined;
    const sentToken = config?.headers?.Authorization;

    // 토큰을 보냈는데 401이면 access token 만료로 보고 한 번만 재발급 후 다시 보낸다.
    if (error instanceof AxiosError && error.response?.status === 401 && config && sentToken && !config._retried) {
      config._retried = true;
      const current = useSessionStore.getState().session?.accessToken;
      // 다른 요청(또는 다른 탭)이 이미 재발급했으면 새 토큰으로 바로 다시 보낸다.
      const nextToken = current && `Bearer ${current}` !== sentToken ? current : await refreshAccessToken();
      if (nextToken) {
        config.headers.Authorization = `Bearer ${nextToken}`;
        return defaultInstance(config);
      }
    }
    return Promise.reject(toApiError(error));
  },
);
