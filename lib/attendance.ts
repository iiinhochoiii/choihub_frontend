import { timeToMinutes } from "./date";
import type { Tone } from "./labels";
import type { AttendanceRecord, AttendanceStatus, CompanyInfo } from "@/types";

export type { AttendanceStatus };

export const ATTENDANCE_STATUS: Record<AttendanceStatus, { label: string; tone: Tone }> = {
  normal: { label: "정상", tone: "success" },
  late: { label: "지각", tone: "warning" },
  early: { label: "조퇴", tone: "warning" },
  working: { label: "근무중", tone: "primary" },
  absent: { label: "미출근", tone: "neutral" },
};

/**
 * 내 기록의 표시용 상태(서버 attendance.rules와 같은 규칙).
 * 팀 근태는 서버가 판정한 status를 그대로 쓴다.
 */
export function getAttendanceStatus(
  record: AttendanceRecord | null | undefined,
  company: Pick<CompanyInfo, "workStart" | "workEnd">,
): AttendanceStatus {
  if (!record?.checkIn) return "absent";
  if (timeToMinutes(record.checkIn) > timeToMinutes(company.workStart)) return "late";
  if (!record.checkOut) return "working";
  if (timeToMinutes(record.checkOut) < timeToMinutes(company.workEnd)) return "early";
  return "normal";
}

/** 근무시간(분). 점심시간 1시간은 4시간 이상 근무 시 차감한다. */
export function getWorkedMinutes(record: AttendanceRecord | null | undefined): number {
  if (!record?.checkIn || !record.checkOut) return 0;
  const raw = timeToMinutes(record.checkOut) - timeToMinutes(record.checkIn);
  return Math.max(0, raw >= 240 ? raw - 60 : raw);
}
