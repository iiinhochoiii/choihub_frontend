"use client";

import styled from "@emotion/styled";
import { CheckCircle2, Lock, Pencil } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Field,
  FormGrid,
  Input,
  Notice,
  PageHeader,
  Stack,
} from "@/components/ui";
import {
  COMPANY_SECTIONS as SECTIONS,
  type CompanyErrors,
  type CompanyForm as FormState,
  fromCompanyForm,
  toCompanyForm as toForm,
  validateCompany,
} from "@/lib/company";
import { isBusinessNumberTaken } from "@/lib/platform";
import { useCurrentUser, useData, usePlatform } from "@/lib/store";

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

const Success = styled(Notice)`
  background: ${({ theme }) => theme.colors.successSoft};
  color: ${({ theme }) => theme.colors.success};
`;

export function CompanyInfoView() {
  const { data, tenantId, update } = useData();
  const { platform } = usePlatform();
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(data.company));
  const [errors, setErrors] = useState<CompanyErrors>({});
  const [saved, setSaved] = useState(false);

  const startEdit = () => {
    setForm(toForm(data.company));
    setErrors({});
    setSaved(false);
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validateCompany(form);
    if (!next.businessNumber && isBusinessNumberTaken(platform, form.businessNumber, tenantId)) {
      next.businessNumber = "ChoiHub에 이미 등록된 사업자등록번호입니다.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    update((prev) => ({ ...prev, company: fromCompanyForm(form) }));
    setEditing(false);
    setSaved(true);
  };

  return (
    <form onSubmit={handleSave} noValidate>
      <PageHeader
        title="회사정보"
        description="회사 기본 정보와 근무 기준을 관리합니다."
        actions={
          user.isManager &&
          (editing ? (
            <>
              <Button $variant="secondary" onClick={() => setEditing(false)}>
                취소
              </Button>
              <Button type="submit">저장</Button>
            </>
          ) : (
            <Button onClick={startEdit}>
              <Pencil />
              정보 수정
            </Button>
          ))
        }
      />

      {!user.isManager && (
        <Notice>
          <Lock />
          회사정보는 매니저만 변경할 수 있습니다.
        </Notice>
      )}
      {saved && !editing && (
        <Success>
          <CheckCircle2 />
          회사정보가 저장되었습니다.
        </Success>
      )}

      <Stack $gap={16}>
        {SECTIONS.map((section) => (
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
                          onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        />
                      ) : (
                        <ReadValue id={id}>
                          {field.key === "defaultAnnualLeave"
                            ? `${data.company.defaultAnnualLeave}일`
                            : String(data.company[field.key])}
                        </ReadValue>
                      )
                    }
                  </Field>
                </div>
              ))}
            </FormGrid>
          </Card>
        ))}
      </Stack>
    </form>
  );
}
