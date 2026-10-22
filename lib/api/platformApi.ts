import { createPlatformSeed } from "../platform";
import type { GroupwareData, PlatformData } from "../types";
import { mockLatency, readPlatform, writePlatform } from "./mockDb";

export type Updater<T> = (prev: T) => T;

/**
 * 플랫폼 데이터 API (목업).
 * 지금은 변경된 데이터를 통째로 저장하지만, 백엔드가 붙으면
 * 리소스별 엔드포인트(POST /notices 등)로 나누고 이 파일의 구현만 교체한다.
 */
export async function fetchPlatform(): Promise<PlatformData> {
  await mockLatency();
  return readPlatform();
}

/** 운영자 화면: 플랫폼 전체 저장 */
export async function savePlatform(platform: PlatformData): Promise<PlatformData> {
  await mockLatency();
  return writePlatform(platform);
}

/** 회사 데이터만 교체한다. 다른 회사의 데이터는 저장소의 최신 값을 유지한다. */
export async function saveTenantData(tenantId: string, data: GroupwareData): Promise<PlatformData> {
  await mockLatency();
  const prev = readPlatform();
  return writePlatform({
    ...prev,
    tenants: prev.tenants.map((t) => (t.id === tenantId ? { ...t, data } : t)),
  });
}

export async function resetPlatform(): Promise<PlatformData> {
  await mockLatency();
  return writePlatform(createPlatformSeed());
}
