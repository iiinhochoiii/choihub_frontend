"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateLeaveRequest, LeaveListParams } from "@/types";
import { queryKeys } from "./queryKeys";
import { attendanceService } from "@/apis/services/attendance";
import { leaveService } from "@/apis/services/leave";

// ───────── 출퇴근 ─────────

export function useTodayAttendance() {
  return useQuery({ queryKey: queryKeys.attendance.today, queryFn: attendanceService.getToday });
}

/** month: YYYY-MM */
export function useMyAttendance(month: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.myMonth(month),
    queryFn: () => attendanceService.getMyMonth(month),
    enabled,
  });
}

/** 매니저 */
export function useTeamAttendance(date?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.attendance.team(date),
    queryFn: () => attendanceService.getTeam(date),
    enabled,
  });
}

function useAttendanceMutation(mutationFn: () => ReturnType<typeof attendanceService.checkIn>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all }),
  });
}

export function useCheckIn() {
  return useAttendanceMutation(attendanceService.checkIn);
}

export function useCheckOut() {
  return useAttendanceMutation(attendanceService.checkOut);
}

// ───────── 휴가 ─────────

export function useMyLeaveRequests() {
  return useQuery({ queryKey: queryKeys.leave.mine, queryFn: leaveService.getMine });
}

export function useLeaveBalance() {
  return useQuery({ queryKey: queryKeys.leave.balance, queryFn: leaveService.getBalance });
}

/** 매니저 */
export function useLeaveRequests(params?: LeaveListParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.leave.list(params),
    queryFn: () => leaveService.getList(params),
    enabled,
  });
}

/** 휴가 변경은 잔여 연차·팀 근태에도 영향을 준다. */
function useLeaveMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
    },
  });
}

export function useCreateLeaveRequest() {
  return useLeaveMutation((body: CreateLeaveRequest) => leaveService.create(body));
}

export function useApproveLeave() {
  return useLeaveMutation((id: string) => leaveService.approve(id));
}

export function useRejectLeave() {
  return useLeaveMutation((id: string) => leaveService.reject(id));
}

export function useCancelLeave() {
  return useLeaveMutation((id: string) => leaveService.cancel(id));
}
