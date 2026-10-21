const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

const pad = (n: number) => String(n).padStart(2, "0");

/** 로컬 기준 YYYY-MM-DD */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** YYYY-MM-DD를 로컬 자정 Date로 변환 */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function weekdayLabel(date: Date): string {
  return WEEKDAYS[date.getDay()];
}

export const WEEKDAY_LABELS = WEEKDAYS;

/** 현재 시각 HH:mm */
export function nowTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** 분 → "8시간 30분" */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return "0분";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** ISO 또는 YYYY-MM-DD → 2026.10.21 */
export function formatDate(value: string): string {
  const date = value.length === 10 ? parseDateKey(value) : new Date(value);
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/** ISO → 2026.10.21 14:05 */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  return `${formatDate(value)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** → 10월 21일 (수) */
export function formatMonthDay(value: string | Date): string {
  const date = typeof value === "string" ? parseDateKey(value) : value;
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdayLabel(date)})`;
}

/** → 2026년 10월 21일 수요일 */
export function formatLongDate(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekdayLabel(date)}요일`;
}

/** ISO → "방금 전", "3시간 전", 7일 이상이면 날짜 */
export function formatRelative(value: string): string {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return formatDate(value);
}

/** ISO 시각이 최근 n일 이내인지 */
export function isWithinDays(value: string, days: number): boolean {
  return Date.now() - new Date(value).getTime() < days * 24 * 60 * 60 * 1000;
}

/** 달력용 6주(42일) 매트릭스. 주는 일요일 시작 */
export function getMonthMatrix(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 6 }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day)),
  );
}

/** start~end(포함) 사이 평일 수 */
export function countWeekdays(startKey: string, endKey: string): number {
  let count = 0;
  for (let d = parseDateKey(startKey); d <= parseDateKey(endKey); d = addDays(d, 1)) {
    if (!isWeekend(d)) count += 1;
  }
  return count;
}
