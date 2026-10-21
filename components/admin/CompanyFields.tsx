"use client";

import styled from "@emotion/styled";
import { Card, CardHeader, CardTitle, Field, FormGrid, Input } from "@/components/ui";
import { COMPANY_SECTIONS, type CompanyErrors, type CompanyForm } from "@/lib/company";

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
  form: CompanyForm;
  errors: CompanyErrors;
  editing: boolean;
  onChange: (key: keyof CompanyForm, value: string) => void;
}

/** 회사정보 섹션 카드 묶음 (운영자 화면용) */
export function CompanyFields({ form, errors, editing, onChange }: Props) {
  return (
    <>
      {COMPANY_SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <FormGrid>
            {section.fields.map((field) => (
              <div key={field.key} data-span={field.full ? "full" : undefined}>
                <Field
                  label={field.label}
                  required={editing && field.required}
                  hint={editing ? field.hint : undefined}
                  error={editing ? errors[field.key] : undefined}
                >
                  {(id) =>
                    editing ? (
                      <Input
                        id={id}
                        type={field.type ?? "text"}
                        value={form[field.key]}
                        placeholder={field.placeholder}
                        min={field.type === "number" ? 0 : undefined}
                        aria-invalid={!!errors[field.key] || undefined}
                        onChange={(e) => onChange(field.key, e.target.value)}
                      />
                    ) : (
                      <ReadValue id={id}>
                        {field.key === "defaultAnnualLeave" ? `${form[field.key]}일` : form[field.key]}
                      </ReadValue>
                    )
                  }
                </Field>
              </div>
            ))}
          </FormGrid>
        </Card>
      ))}
    </>
  );
}
