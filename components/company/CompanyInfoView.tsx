"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock, Pencil } from "lucide-react";
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
import { COMPANY_SECTIONS as SECTIONS } from "@/lib/company";
import { isBusinessNumberTaken } from "@/lib/platform";
import {
  type CompanyFormInput,
  type CompanyFormValues,
  companySchema,
  toCompanyFormInput,
} from "@/lib/schemas/company";
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
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CompanyFormInput, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: toCompanyFormInput(data.company),
  });

  const startEdit = () => {
    reset(toCompanyFormInput(data.company));
    setSaved(false);
    setEditing(true);
  };

  const handleSave = handleSubmit((values) => {
    if (isBusinessNumberTaken(platform, values.businessNumber, tenantId)) {
      return setError("businessNumber", { message: "ChoiHub에 이미 등록된 사업자등록번호입니다." });
    }

    update((prev) => ({ ...prev, company: values }));
    setEditing(false);
    setSaved(true);
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
