"use client";

import styled from "@emotion/styled";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { Card, CardHeader, CardTitle, Field, FormGrid, Input } from "@/components/ui";
import { COMPANY_SECTIONS, type CompanyKey } from "@/lib/company";
import type { CompanyInfo } from "@/lib/types";

const ReadValue = styled.p`
  min-height: 38px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  word-break: break-all;

  &:empty::before {
    content: "-";
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

interface Props {
  /** 읽기 모드에서 보여줄 저장된 회사정보 */
  company: CompanyInfo;
  editing: boolean;
  /** 항목 키를 폼 필드에 연결한다. 중첩 폼이면 `(key) => register(\`company.${key}\`)`처럼 넘긴다. */
  register: (key: CompanyKey) => UseFormRegisterReturn;
  errors?: Partial<Record<CompanyKey, FieldError>>;
}

/** 회사정보 섹션 카드 묶음 (운영자 화면용) */
export function CompanyFields({ company, editing, register, errors }: Props) {
  return (
    <>
      {COMPANY_SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <FormGrid>
            {section.fields.map((field) => {
              const error = errors?.[field.key]?.message;
              return (
                <div key={field.key} data-span={field.full ? "full" : undefined}>
                  <Field
                    label={field.label}
                    required={editing && field.required}
                    hint={editing ? field.hint : undefined}
                    error={editing ? error : undefined}
                  >
                    {(id) =>
                      editing ? (
                        <Input
                          id={id}
                          type={field.type ?? "text"}
                          placeholder={field.placeholder}
                          min={field.type === "number" ? 0 : undefined}
                          aria-invalid={!!error || undefined}
                          {...register(field.key)}
                        />
                      ) : (
                        <ReadValue id={id}>
                          {field.key === "defaultAnnualLeave" ? `${company[field.key]}일` : String(company[field.key])}
                        </ReadValue>
                      )
                    }
                  </Field>
                </div>
              );
            })}
          </FormGrid>
        </Card>
      ))}
    </>
  );
}
