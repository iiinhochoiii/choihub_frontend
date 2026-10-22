import type { LeaveType } from "./leave";

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // HH:mm
  checkOut: string | null; // HH:mm
}

export type AttendanceStatus = "normal" | "late" | "early" | "working" | "absent";

export type TeamAttendanceStatus = AttendanceStatus | "leave";

export interface TodayAttendanceResponse {
  /** 서버 기준(Asia/Seoul) 오늘 */
  date: string;
  record: AttendanceRecord | null;
}

export interface TeamAttendanceRow {
  memberId: string;
  record: AttendanceRecord | null;
  /** 그날 승인된 휴가 */
  leave: { id: string; type: LeaveType; startDate: string; endDate: string } | null;
  status: TeamAttendanceStatus;
}

export interface TeamAttendanceResponse {
  date: string;
  workStart: string;
  workEnd: string;
  counts: { present: number; late: number; leave: number; absent: number };
  rows: TeamAttendanceRow[];
}
