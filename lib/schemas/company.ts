import { z } from "zod";
import { EMAIL_PATTERN } from "@/lib/company";
import { timeToMinutes } from "@/lib/date";
import type { CompanyInfo } from "@/types";

const required = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label}을(를) 입력하세요.`);

/** 비어 있으면 통과, 값이 있으면 형식을 검사한다. */
const optionalPattern = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .refine((v) => !v || pattern.test(v), message);

/**
 * 회사정보 형식 검증. 사업자번호 중복처럼 다른 회사와 비교해야 하는 검증은 서버가 한다.
 */
export const companySchema = z
  .object({
    name: required("회사명"),
    nameEn: z.string().trim(),
    ceo: required("대표자"),
    businessNumber: required("사업자등록번호").regex(/^\d{3}-\d{2}-\d{5}$/, "000-00-00000 형식으로 입력하세요."),
    corporateNumber: z.string().trim(),
    industry: z.string().trim(),
    foundedAt: z.string().trim(),
    phone: required("대표전화"),
    fax: z.string().trim(),
    email: required("대표 이메일").regex(EMAIL_PATTERN, "올바른 이메일 형식이 아닙니다."),
    website: optionalPattern(/^https?:\/\/\S+$/, "http:// 또는 https://로 시작해야 합니다."),
    address: z.string().trim(),
    workStart: required("출근 시간"),
    workEnd: required("퇴근 시간"),
    defaultAnnualLeave: required("기본 연차일수")
      .refine((v) => {
        const leave = Number(v);
        return Number.isInteger(leave) && leave >= 0 && leave <= 365;
      }, "0~365 사이의 정수를 입력하세요.")
      .transform(Number),
  })
  .refine((v) => !v.workStart || !v.workEnd || timeToMinutes(v.workStart) < timeToMinutes(v.workEnd), {
    path: ["workEnd"],
    message: "퇴근 시간은 출근 시간보다 늦어야 합니다.",
    // 다른 항목에 오류가 있어도 함께 표시한다.
    when: () => true,
  });

/** 입력 중 값(연차일수는 문자열) */
export type CompanyFormInput = z.input<typeof companySchema>;
/** 검증·정리된 값 (CompanyInfo와 같은 모양) */
export type CompanyFormValues = z.output<typeof companySchema>;

export function toCompanyFormInput(company: CompanyInfo): CompanyFormInput {
  return { ...company, defaultAnnualLeave: String(company.defaultAnnualLeave) };
}

/** 매니저 계정 형식 검증. 이메일 중복은 서버가 검사한다. */
export const managerSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요."),
  email: z.string().trim().min(1, "이메일을 입력하세요.").regex(EMAIL_PATTERN, "올바른 이메일 형식이 아닙니다."),
  phone: z
    .string()
    .trim()
    .min(1, "휴대폰 번호를 입력하세요.")
    .regex(/^\d{2,3}-\d{3,4}-\d{4}$/, "010-0000-0000 형식으로 입력하세요."),
  position: z.string().trim(),
});

export type ManagerFormValues = z.infer<typeof managerSchema>;

export const EMPTY_MANAGER: ManagerFormValues = { name: "", email: "", phone: "", position: "" };

/** 회사 계정 발급 화면: 회사정보 + 첫 매니저 계정 */
export const companyCreateSchema = z.object({
  company: companySchema,
  manager: managerSchema,
});

export type CompanyCreateFormInput = z.input<typeof companyCreateSchema>;
export type CompanyCreateFormValues = z.output<typeof companyCreateSchema>;
