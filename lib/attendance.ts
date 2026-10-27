import { minutesToTime, timeToMinutes } from "./date";
import { LEAVE_TYPES, type Tone } from "./labels";
import type { AttendanceRecord, AttendanceStatus, CompanyInfo, LeaveType, TeamAttendanceStatus } from "@/types";

export type { AttendanceStatus, TeamAttendanceStatus };

type WorkHours = Pick<CompanyInfo, "workStart" | "workEnd">;

/** 반차 경계 = 출근 + 반일 근무 4시간 + 점심 1시간 (09:00 출근이면 14:00) */
const HALF_DAY_MINUTES = 240;
const LUNCH_MINUTES = 60;

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
  company: WorkHours,
): AttendanceStatus {
  if (!record?.checkIn) return "absent";
  if (timeToMinutes(record.checkIn) > timeToMinutes(company.workStart)) return "late";
  if (!record.checkOut) return "working";
  if (timeToMinutes(record.checkOut) < timeToMinutes(company.workEnd)) return "early";
  return "normal";
}

/** 반차는 하루의 일부만 쉬므로 출퇴근 기록으로 판정한다. */
export function isHalfDayLeave(type: LeaveType): boolean {
  return type === "half_am" || type === "half_pm";
}

/** 반차를 반영한 그날의 근무시간: 오전 반차는 출근 기준을, 오후 반차는 퇴근 기준을 경계 시각으로 옮긴다. */
export function getWorkHoursForLeave(company: WorkHours, leaveType: LeaveType | null | undefined): WorkHours {
  if (leaveType !== "half_am" && leaveType !== "half_pm") return company;
  const boundary = minutesToTime(
    Math.min(timeToMinutes(company.workStart) + HALF_DAY_MINUTES + LUNCH_MINUTES, timeToMinutes(company.workEnd)),
  );
  return leaveType === "half_am"
    ? { workStart: boundary, workEnd: company.workEnd }
    : { workStart: company.workStart, workEnd: boundary };
}

/**
 * 승인 휴가를 반영한 상태(서버 attendance.rules의 getTeamStatus와 같은 규칙).
 * 종일 휴가는 기록이 있어도 leave, 반차는 기록이 없으면 leave, 있으면 경계 시각 기준으로 판정한다.
 */
export function getDayStatus(
  record: AttendanceRecord | null | undefined,
  leaveType: LeaveType | null | undefined,
  company: WorkHours,
): TeamAttendanceStatus {
  if (leaveType && (!isHalfDayLeave(leaveType) || !record?.checkIn)) return "leave";
  return getAttendanceStatus(record, getWorkHoursForLeave(company, leaveType));
}

/** 상태 배지 값. leave면 휴가 종류를 보여 준다. */
export function getDayStatusBadge(
  status: TeamAttendanceStatus,
  leaveType: LeaveType | null | undefined,
): { label: string; tone: Tone } {
  if (status !== "leave") return ATTENDANCE_STATUS[status];
  return { label: leaveType ? LEAVE_TYPES[leaveType].label : "휴가", tone: "info" };
}

/** 근무시간(분). 점심시간 1시간은 4시간 이상 근무 시 차감한다. */
export function getWorkedMinutes(record: AttendanceRecord | null | undefined): number {
  if (!record?.checkIn || !record.checkOut) return 0;
  const raw = timeToMinutes(record.checkOut) - timeToMinutes(record.checkIn);
  return Math.max(0, raw >= 240 ? raw - 60 : raw);
}
