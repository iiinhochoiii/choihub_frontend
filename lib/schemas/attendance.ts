import { z } from "zod";
import { countWeekdays } from "@/lib/date";
import { LEAVE_TYPES } from "@/lib/labels";
import type { LeaveType } from "@/types";

/** 반차는 하루(시작일)만, 그 외는 기간 내 평일 수로 신청 일수를 계산한다. */
export function getLeavePeriod(type: LeaveType, startDate: string, endDate: string) {
  const isHalf = LEAVE_TYPES[type].days !== null;
  const effectiveEnd = isHalf ? startDate : endDate;
  const days =
    !startDate || !effectiveEnd || effectiveEnd < startDate
      ? 0
      : isHalf
        ? 0.5
        : countWeekdays(startDate, effectiveEnd);
  return { isHalf, endDate: effectiveEnd, days };
}

export const leaveRequestSchema = z
  .object({
    type: z.enum(Object.keys(LEAVE_TYPES) as [LeaveType, ...LeaveType[]]),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().trim().min(1, "사유를 입력하세요."),
  })
  .superRefine((values, ctx) => {
    const { isHalf, endDate, days } = getLeavePeriod(values.type, values.startDate, values.endDate);
    if (!values.startDate || !endDate) {
      ctx.addIssue({
        code: "custom",
        path: [values.startDate ? "endDate" : "startDate"],
        message: "기간을 입력하세요.",
      });
      return;
    }
    if (endDate < values.startDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "종료일이 시작일보다 빠릅니다." });
      return;
    }
    if (days <= 0) {
      ctx.addIssue({
        code: "custom",
        path: [isHalf ? "startDate" : "endDate"],
        message: "선택한 기간에 평일이 없습니다.",
      });
    }
  });

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;
