"use client";

import { Field, FormGrid, Input } from "@/components/ui";
import { EMAIL_PATTERN } from "@/lib/company";
import { isEmailTaken } from "@/lib/platform";
import type { PlatformData } from "@/lib/types";

export interface ManagerForm {
  name: string;
  email: string;
  phone: string;
  position: string;
}

export type ManagerErrors = Partial<Record<keyof ManagerForm, string>>;

export const EMPTY_MANAGER: ManagerForm = { name: "", email: "", phone: "", position: "" };

export function validateManager(form: ManagerForm, platform: PlatformData): ManagerErrors {
  const errors: ManagerErrors = {};
  if (!form.name.trim()) errors.name = "이름을 입력하세요.";
  if (!form.email.trim()) errors.email = "이메일을 입력하세요.";
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "올바른 이메일 형식이 아닙니다.";
  else if (isEmailTaken(platform, form.email)) errors.email = "이미 ChoiHub에서 사용 중인 이메일입니다.";
  if (!form.phone.trim()) errors.phone = "휴대폰 번호를 입력하세요.";
  else if (!/^\d{2,3}-\d{3,4}-\d{4}$/.test(form.phone.trim())) errors.phone = "010-0000-0000 형식으로 입력하세요.";
  return errors;
}

interface Props {
  form: ManagerForm;
  errors: ManagerErrors;
  onChange: (key: keyof ManagerForm, value: string) => void;
}

/** 매니저 계정 입력 항목 (회사 계정 발급, 매니저 추가에서 공용) */
export function ManagerFields({ form, errors, onChange }: Props) {
  return (
    <FormGrid>
      <Field label="이름" required error={errors.name}>
        {(id) => (
          <Input id={id} value={form.name} aria-invalid={!!errors.name || undefined} onChange={(e) => onChange("name", e.target.value)} />
        )}
      </Field>
      <Field label="직급" hint="비워 두면 '매니저'로 등록됩니다.">
        {(id) => (
          <Input id={id} value={form.position} placeholder="예: 인사팀장" onChange={(e) => onChange("position", e.target.value)} />
        )}
      </Field>
      <Field label="이메일 (로그인 ID)" required error={errors.email}>
        {(id) => (
          <Input
            id={id}
            type="email"
            value={form.email}
            placeholder="manager@company.com"
            aria-invalid={!!errors.email || undefined}
            onChange={(e) => onChange("email", e.target.value)}
          />
        )}
      </Field>
      <Field label="휴대폰" required error={errors.phone}>
        {(id) => (
          <Input
            id={id}
            type="tel"
            value={form.phone}
            placeholder="010-0000-0000"
            aria-invalid={!!errors.phone || undefined}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        )}
      </Field>
    </FormGrid>
  );
}
