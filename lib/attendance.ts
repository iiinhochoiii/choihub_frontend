import { timeToMinutes } from "./date";
import type { Tone } from "./labels";
import type { AttendanceRecord, CompanyInfo, LeaveRequest } from "./types";

export type AttendanceStatus = "normal" | "late" | "early" | "working" | "absent";

export const ATTENDANCE_STATUS: Record<AttendanceStatus, { label: string; tone: Tone }> = {
  normal: { label: "정상", tone: "success" },
  late: { label: "지각", tone: "warning" },
  early: { label: "조퇴", tone: "warning" },
  working: { label: "근무중", tone: "primary" },
  absent: { label: "미출근", tone: "neutral" },
};

export function getAttendanceStatus(
  record: AttendanceRecord | undefined,
  company: Pick<CompanyInfo, "workStart" | "workEnd">,
): AttendanceStatus {
  if (!record?.checkIn) return "absent";
  if (timeToMinutes(record.checkIn) > timeToMinutes(company.workStart)) return "late";
  if (!record.checkOut) return "working";
  if (timeToMinutes(record.checkOut) < timeToMinutes(company.workEnd)) return "early";
  return "normal";
}

/** 근무시간(분). 점심시간 1시간은 4시간 이상 근무 시 차감한다. */
export function getWorkedMinutes(record: AttendanceRecord | undefined): number {
  if (!record?.checkIn || !record.checkOut) return 0;
  const raw = timeToMinutes(record.checkOut) - timeToMinutes(record.checkIn);
  return Math.max(0, raw >= 240 ? raw - 60 : raw);
}

/** 해당 연도에 승인된 휴가 사용일수 */
export function getUsedLeaveDays(
  requests: LeaveRequest[],
  memberId: string,
  year = new Date().getFullYear(),
): number {
  return requests
    .filter(
      (r) =>
        r.memberId === memberId &&
        r.status === "approved" &&
        r.type !== "sick" &&
        r.type !== "special" &&
        r.startDate.startsWith(String(year)),
    )
    .reduce((sum, r) => sum + r.days, 0);
}
