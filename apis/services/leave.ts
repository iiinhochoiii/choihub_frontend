import { defaultInstance } from "../defaultInstance";
import type { CreateLeaveRequest, LeaveBalance, LeaveListParams, LeaveRequest } from "@/types";

export const leaveService = {
  getMine: () => defaultInstance.get<LeaveRequest[]>("/leave-requests/me").then((r) => r.data),

  getBalance: () => defaultInstance.get<LeaveBalance>("/leave-requests/balance").then((r) => r.data),

  /** 매니저: 회사 전체 신청 */
  getList: (params?: LeaveListParams) =>
    defaultInstance.get<LeaveRequest[]>("/leave-requests", { params }).then((r) => r.data),

  create: (body: CreateLeaveRequest) =>
    defaultInstance.post<LeaveRequest>("/leave-requests", body).then((r) => r.data),

  /** 매니저 */
  approve: (id: string) => defaultInstance.post<LeaveRequest>(`/leave-requests/${id}/approve`).then((r) => r.data),

  /** 매니저 */
  reject: (id: string) => defaultInstance.post<LeaveRequest>(`/leave-requests/${id}/reject`).then((r) => r.data),

  /** 본인의 대기 중 신청 취소 */
  cancel: (id: string) => defaultInstance.delete<void>(`/leave-requests/${id}`).then(() => undefined),
};
