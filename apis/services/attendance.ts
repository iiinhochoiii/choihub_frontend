import { defaultInstance } from "../defaultInstance";
import type { AttendanceRecord, TeamAttendanceResponse, TodayAttendanceResponse } from "@/types";

export const attendanceService = {
  checkIn: () => defaultInstance.post<AttendanceRecord>("/attendance/check-in").then((r) => r.data),

  checkOut: () => defaultInstance.post<AttendanceRecord>("/attendance/check-out").then((r) => r.data),

  getToday: () => defaultInstance.get<TodayAttendanceResponse>("/attendance/today").then((r) => r.data),

  /** 내 월별 기록. month: YYYY-MM */
  getMyMonth: (month: string) =>
    defaultInstance.get<AttendanceRecord[]>("/attendance/me", { params: { month } }).then((r) => r.data),

  /** 매니저: 팀 근태. date를 생략하면 오늘 */
  getTeam: (date?: string) =>
    defaultInstance.get<TeamAttendanceResponse>("/attendance/team", { params: { date } }).then((r) => r.data),
};
