import { minutesToTime, timeToMinutes } from "@/lib/date";
import type { Reservation } from "@/lib/types";

export const DAY_START = 9 * 60;
export const DAY_END = 19 * 60;
export const SLOT_MINUTES = 30;
export const SLOT_WIDTH = 56;

/** 09:00, 09:30, ... 18:30 (각 슬롯의 시작 시각) */
export const SLOT_STARTS = Array.from(
  { length: (DAY_END - DAY_START) / SLOT_MINUTES },
  (_, i) => minutesToTime(DAY_START + i * SLOT_MINUTES),
);

/** 종료 시각 선택지: 09:30 ~ 19:00 */
export const SLOT_ENDS = SLOT_STARTS.map((t) => minutesToTime(timeToMinutes(t) + SLOT_MINUTES));

export function slotIndex(time: string): number {
  return (timeToMinutes(time) - DAY_START) / SLOT_MINUTES;
}

export function isOverlapping(
  reservations: Reservation[],
  candidate: Pick<Reservation, "roomId" | "date" | "startTime" | "endTime">,
  ignoreId?: string,
): boolean {
  return reservations.some(
    (r) =>
      r.id !== ignoreId &&
      r.roomId === candidate.roomId &&
      r.date === candidate.date &&
      r.startTime < candidate.endTime &&
      r.endTime > candidate.startTime,
  );
}
