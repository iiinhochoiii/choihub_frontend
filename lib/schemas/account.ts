import { z } from "zod";
import { MEMBER_STATUS } from "@/lib/labels";
import type { MemberStatus } from "@/lib/types";

const PASSWORD_MIN_LENGTH = 8;

/**
 * 첫 로그인 시 초기 비밀번호 변경.
 * 초기 비밀번호와 같은지는 현재 사용자와 비교해야 하므로 제출 시점에 검사한다.
 */
export const initialPasswordSchema = z
  .object({
    password: z.string().min(PASSWORD_MIN_LENGTH, "비밀번호는 8자 이상이어야 합니다."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "비밀번호가 일치하지 않습니다." });

export type InitialPasswordFormValues = z.infer<typeof initialPasswordSchema>;

/**
 * 내 정보 화면의 비밀번호 변경.
 * 현재 비밀번호 일치 여부는 현재 사용자와 비교해야 하므로 제출 시점에 검사한다.
 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string(),
    nextPassword: z.string().min(PASSWORD_MIN_LENGTH, "새 비밀번호는 8자 이상이어야 합니다."),
    confirmPassword: z.string(),
  })
  .refine((v) => v.nextPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "새 비밀번호가 일치하지 않습니다.",
  });

export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

const PHONE_PATTERN = /^\d{2,3}-\d{3,4}-\d{4}$/;

/** 내 정보 화면의 기본 정보(연락처·근무 상태) */
export const profileSchema = z.object({
  phone: z.string().regex(PHONE_PATTERN, "휴대폰 번호 형식을 확인해 주세요. (예: 010-1234-5678)"),
  extension: z.string(),
  status: z.enum(Object.keys(MEMBER_STATUS) as [MemberStatus, ...MemberStatus[]]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
