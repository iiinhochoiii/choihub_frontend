import { formatDate } from "@/lib/date";
import type { LeaveRequest } from "@/lib/types";

/** 해당 날짜를 포함하는 승인된 휴가 */
export function findLeaveOn(
  requests: LeaveRequest[],
  memberId: string,
  date: string,
): LeaveRequest | undefined {
  return requests.find(
    (r) =>
      r.memberId === memberId && r.status === "approved" && r.startDate <= date && r.endDate >= date,
  );
}

export function formatPeriod(start: string, end: string): string {
  return start === end ? formatDate(start) : `${formatDate(start)} ~ ${formatDate(end)}`;
}

/** 연차 차감 대상(연차·반차) 여부 */
export function isAnnualType(type: LeaveRequest["type"]): boolean {
  return type === "annual" || type === "half_am" || type === "half_pm";
}
