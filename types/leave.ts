import type { ISODateString } from "./common";

export type LeaveType = "annual" | "half_am" | "half_pm" | "sick" | "special";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface LeaveRequest {
  id: string;
  memberId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  createdAt: ISODateString;
  /** 처리 전이거나 자동 승인이면 없다. */
  reviewerId?: string;
  /** 매니저 본인의 휴가라 승인 절차 없이 승인됨 */
  autoApproved: boolean;
}

export interface LeaveBalance {
  total: number;
  /** 올해 승인된 연차 차감 합계 */
  used: number;
  /** 승인 대기 중인 연차 차감 합계 */
  pending: number;
  available: number;
}

export interface CreateLeaveRequest {
  type: LeaveType;
  startDate: string;
  /** 반차는 생략하면 startDate와 같다. */
  endDate?: string;
  reason: string;
}

export interface LeaveListParams {
  status?: RequestStatus;
}
