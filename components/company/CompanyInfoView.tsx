"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2, Lock, Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { getErrorMessage } from "@/apis/defaultInstance";
import { COMPANY_SECTIONS as SECTIONS } from "@/lib/company";
import { setServerErrors } from "@/lib/form";
import {
  type CompanyFormInput,
  type CompanyFormValues,
  companySchema,
  toCompanyFormInput,
} from "@/lib/schemas/company";
import { useCurrentUser } from "@/queries/auth";
import { useCompany, useUpdateCompany } from "@/queries/directory";

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
  const company = useCompany();
  const updateCompany = useUpdateCompany();
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CompanyFormInput, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toCompanyFormInput(company),
  });

  const startEdit = () => {
    reset(toCompanyFormInput(company));
    setSaved(false);
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = handleSubmit((values) => {
    setSaveError(null);
    // 사업자번호 중복은 서버가 검사한다.
    updateCompany.mutate(values, {
      onSuccess: () => {
        setEditing(false);
        setSaved(true);
      },
      onError: (error) => {
        if (!setServerErrors(error, setError)) setSaveError(getErrorMessage(error));
      },
    });
  });

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
              <Button type="submit" disabled={updateCompany.isPending}>
                저장
              </Button>
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
      {saveError && editing && (
        <Notice $tone="warning">
          <AlertCircle />
          {saveError}
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
                    error={editing ? errors[field.key]?.message : undefined}
                  >
                    {(id) =>
                      editing ? (
                        <Input
                          id={id}
                          type={field.type ?? "text"}
                          placeholder={field.placeholder}
                          min={field.type === "number" ? 0 : undefined}
                          aria-invalid={!!errors[field.key] || undefined}
                          {...register(field.key)}
                        />
                      ) : (
                        <ReadValue id={id}>
                          {field.key === "defaultAnnualLeave"
                            ? `${company.defaultAnnualLeave}일`
                            : String(company[field.key])}
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
