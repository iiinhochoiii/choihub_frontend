import { createPlatformSeed, PLATFORM_VERSION } from "../platform";
import type { GroupwareData, PlatformData } from "../types";

/**
 * 백엔드가 붙기 전까지 서버 DB 역할을 하는 localStorage 저장소.
 * lib/api의 함수만 이 파일을 사용하며, API가 준비되면 이 파일은 지운다.
 */
export const PLATFORM_KEY = "groupware:platform";
/** 단일 회사 시절 저장 키. 더 이상 읽지 않으며 발견되면 지운다. */
const LEGACY_DATA_KEY = "groupware:data";

/** 네트워크 지연 흉내(ms). 로딩 UI를 확인할 때 늘려서 쓴다. */
const MOCK_LATENCY = 0;

export function mockLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY));
}

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

function removeLegacyData() {
  try {
    localStorage.removeItem(LEGACY_DATA_KEY);
  } catch {
    // 지우지 못해도 읽지 않으므로 무시한다.
  }
}

export function writePlatform(platform: PlatformData): PlatformData {
  try {
    localStorage.setItem(PLATFORM_KEY, JSON.stringify(platform));
  } catch (error) {
    console.warn(`[mockDb] ${PLATFORM_KEY} 저장 실패`, error);
  }
  return platform;
}

/**
 * 현재 버전으로 저장된 데이터만 불러온다.
 * 이전 버전(데모 회사·서비스명 변경 전 데이터 포함)이나 손상된 데이터는 새 시드로 초기화한다.
 */
export function readPlatform(): PlatformData {
  removeLegacyData();
  try {
    const raw = localStorage.getItem(PLATFORM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlatformData;
      if (parsed.version === PLATFORM_VERSION) return normalizePlatform(parsed);
    }
  } catch {
    // 손상된 데이터는 시드로 대체한다.
  }
  return writePlatform(createPlatformSeed());
}
