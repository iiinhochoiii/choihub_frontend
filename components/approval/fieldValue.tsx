"use client";

import type { UseFormRegisterReturn } from "react-hook-form";
import { Input, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/date";
import type { FormField } from "@/types";

/** 양식 필드 타입에 맞는 입력 컨트롤. register() 결과를 그대로 넘겨 받는다. */
export function FieldControl({
  id,
  field,
  invalid,
  ...registered
}: UseFormRegisterReturn & {
  id: string;
  field: FormField;
  invalid?: boolean;
}) {
  const common = {
    id,
    placeholder: field.placeholder,
    "aria-invalid": invalid || undefined,
    ...registered,
  };
  switch (field.type) {
    case "textarea":
      return <Textarea {...common} />;
    case "number":
      return <Input {...common} type="number" inputMode="numeric" min={0} />;
    case "date":
      return <Input {...common} type="date" />;
    default:
      return <Input {...common} type="text" />;
  }
}

/** 문서 본문 표시용 값 포맷 */
export function formatFieldValue(field: FormField, value: string | undefined): string {
  if (!value) return "-";
  if (field.type === "date") return formatDate(value);
  if (field.type === "number") {
    const n = Number(value);
    return Number.isFinite(n) ? n.toLocaleString("ko-KR") : value;
  }
  return value;
}
