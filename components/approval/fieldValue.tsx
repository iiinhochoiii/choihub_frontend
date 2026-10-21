"use client";

import { Input, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/date";
import type { FormField } from "@/lib/types";

/** 양식 필드 타입에 맞는 입력 컨트롤 */
export function FieldControl({
  id,
  field,
  value,
  invalid,
  onChange,
}: {
  id: string;
  field: FormField;
  value: string;
  invalid?: boolean;
  onChange: (value: string) => void;
}) {
  const common = {
    id,
    value,
    placeholder: field.placeholder,
    "aria-invalid": invalid || undefined,
  };
  switch (field.type) {
    case "textarea":
      return <Textarea {...common} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <Input
          {...common}
          type="number"
          inputMode="numeric"
          min={0}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return <Input {...common} type="date" onChange={(e) => onChange(e.target.value)} />;
    default:
      return <Input {...common} type="text" onChange={(e) => onChange(e.target.value)} />;
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
