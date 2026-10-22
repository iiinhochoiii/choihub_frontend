import { z } from "zod";
import { EMAIL_PATTERN } from "@/lib/company";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import type { MemberStatus, Role } from "@/lib/types";

const LEAVE_MESSAGE = "0~40 사이 숫자를 입력하세요.";

/**
 * 구성원 정보 형식 검증. 이메일 중복(isEmailTaken)과 매니저 권한 해제 제한처럼
 * 앱 데이터와 비교해야 하는 검증은 제출 시점에 추가한다.
 */
export const memberSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요."),
  email: z.string().trim().min(1, "이메일을 입력하세요.").regex(EMAIL_PATTERN, "이메일 형식이 올바르지 않습니다."),
  departmentId: z.string().min(1, "부서를 선택하세요."),
  position: z.string().trim().min(1, "직급을 입력하세요."),
  role: z.enum(Object.keys(ROLE_LABELS) as [Role, ...Role[]]),
  status: z.enum(Object.keys(MEMBER_STATUS) as [MemberStatus, ...MemberStatus[]]),
  phone: z.string().trim().min(1, "휴대폰 번호를 입력하세요."),
  extension: z.string().trim(),
  joinedAt: z.string(),
  birthday: z.string().refine((v) => !v || /^\d{2}-\d{2}$/.test(v), "MM-DD 형식으로 입력하세요."),
  annualLeaveTotal: z.coerce.number({ error: LEAVE_MESSAGE }).min(0, LEAVE_MESSAGE).max(40, LEAVE_MESSAGE),
});

export type MemberFormInput = z.input<typeof memberSchema>;
export type MemberFormValues = z.output<typeof memberSchema>;

/** 부서 추가. 같은 위치의 이름 중복은 제출 시점에 검사한다. */
export const departmentSchema = z.object({
  name: z.string().trim().min(1, "부서명을 입력하세요."),
  /** 빈 문자열이면 최상위 부서 */
  parentId: z.string(),
});

export type DepartmentFormValues = z.infer<typeof departmentSchema>;
