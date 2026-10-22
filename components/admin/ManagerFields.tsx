"use client";

import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Field, FormGrid, Input } from "@/components/ui";
import type { ManagerFormValues } from "@/lib/schemas/company";

type ManagerKey = keyof ManagerFormValues;

interface Props {
  /** 항목 키를 폼 필드에 연결한다. 중첩 폼이면 `(key) => register(\`manager.${key}\`)`처럼 넘긴다. */
  register: (key: ManagerKey) => UseFormRegisterReturn;
  errors?: Partial<Record<ManagerKey, FieldError>>;
}

/** 매니저 계정 입력 항목 (회사 계정 발급, 매니저 추가에서 공용) */
export function ManagerFields({ register, errors }: Props) {
  return (
    <FormGrid>
      <Field label="이름" required error={errors?.name?.message}>
        {(id) => <Input id={id} aria-invalid={!!errors?.name || undefined} {...register("name")} />}
      </Field>
      <Field label="직급" hint="비워 두면 '매니저'로 등록됩니다.">
        {(id) => <Input id={id} placeholder="예: 인사팀장" {...register("position")} />}
      </Field>
      <Field label="이메일 (로그인 ID)" required error={errors?.email?.message}>
        {(id) => (
          <Input
            id={id}
            type="email"
            placeholder="manager@company.com"
            aria-invalid={!!errors?.email || undefined}
            {...register("email")}
          />
        )}
      </Field>
      <Field label="휴대폰" required error={errors?.phone?.message}>
        {(id) => (
          <Input
            id={id}
            type="tel"
            placeholder="010-0000-0000"
            aria-invalid={!!errors?.phone || undefined}
            {...register("phone")}
          />
        )}
      </Field>
    </FormGrid>
  );
}
