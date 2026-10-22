"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, FileText, Info, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ApprovalLine } from "@/components/approval/ApprovalLine";
import { FieldControl } from "@/components/approval/fieldValue";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  Field,
  FormGrid,
  Input,
  LoadingState,
  Muted,
  Notice,
  PageHeader,
  Row,
  SectionTitle,
  Stack,
} from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { previewSteps } from "@/lib/approval";
import { setServerErrors } from "@/lib/form";
import { type ApprovalDraftFormValues, createApprovalDraftSchema } from "@/lib/schemas/approval";
import { useApprovalForms, useCreateApprovalDoc } from "@/queries/approval";
import { useCurrentUser } from "@/queries/auth";
import type { ApprovalForm } from "@/types";

const ErrorText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

const FormGridCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
`;

const FormCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 18px;
  text-align: left;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  strong {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
  }

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export default function NewApprovalPage() {
  // 사용 중인 양식만 받는다.
  const { data: forms, isPending, error, refetch } = useApprovalForms({ active: true });
  const [form, setForm] = useState<ApprovalForm | null>(null);

  return (
    <>
      <PageHeader
        title="새 결재 작성"
        description={form ? `${form.name} 작성` : "작성할 결재 양식을 선택하세요."}
        actions={
          form ? (
            <Button $variant="secondary" onClick={() => setForm(null)}>
              <ArrowLeft />
              양식 다시 선택
            </Button>
          ) : (
            <ButtonLink href="/dashboard/approval" $variant="secondary">
              <ArrowLeft />
              목록으로
            </ButtonLink>
          )
        }
      />
      {form ? (
        <DraftForm key={form.id} form={form} />
      ) : isPending ? (
        <Card>
          <LoadingState />
        </Card>
      ) : error ? (
        <Card>
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        </Card>
      ) : forms.length === 0 ? (
        <Card>
          <EmptyState title="사용 가능한 결재 양식이 없습니다." description="매니저에게 양식 등록을 요청하세요." />
        </Card>
      ) : (
        <FormGridCards>
          {forms.map((f) => (
            <FormCard key={f.id} type="button" onClick={() => setForm(f)}>
              <Badge $tone="primary">{f.category}</Badge>
              <strong>
                <FileText />
                {f.name}
              </strong>
              <p>{f.description || "설명이 없습니다."}</p>
              <Muted>
                입력 항목 {f.fields.length}개 · 결재자 {f.approverIds.length}명
              </Muted>
            </FormCard>
          ))}
        </FormGridCards>
      )}
    </>
  );
}

function DraftForm({ form }: { form: ApprovalForm }) {
  const router = useRouter();
  const user = useCurrentUser();
  const createDoc = useCreateApprovalDoc();
  const schema = useMemo(() => createApprovalDraftSchema(form.fields), [form.fields]);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApprovalDraftFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      values: Object.fromEntries(form.fields.map((f) => [f.id, ""])),
    },
  });

  // 결재선 미리보기. 실제 단계·문서번호는 상신할 때 서버가 만든다.
  const steps = previewSteps(form.approverIds, user.id);

  const submit = handleSubmit(({ title, values }) => {
    if (steps.length === 0) return;
    createDoc.mutate(
      { formId: form.id, title, values },
      {
        onSuccess: (doc) => router.push(`/dashboard/approval/${doc.id}`),
        onError: (err) => {
          if (!setServerErrors(err, setError)) setError("root", { message: getErrorMessage(err) });
        },
      },
    );
  });

  return (
    <form onSubmit={submit} noValidate>
      <Stack $gap={16}>
        <Card>
          <CardHeader>
            <CardTitle>결재선</CardTitle>
          </CardHeader>
          <Notice>
            <Info />
            결재선은 매니저가 양식에 지정한 순서대로 자동 적용됩니다.
            {!user.isManager && " 일반 직원은 양식과 결재선을 변경할 수 없습니다."}
          </Notice>
          {steps.length === 0 ? (
            <Notice $tone="warning">
              <Info />
              지정된 결재자가 없어 상신할 수 없습니다. 매니저에게 양식의 결재선 설정을 요청하세요.
            </Notice>
          ) : (
            <ApprovalLine drafterId={user.id} steps={steps} />
          )}
        </Card>

        <Card>
          <SectionTitle>문서 내용</SectionTitle>
          <FormGrid>
            <div data-span="full">
              <Field label="제목" required error={errors.title?.message}>
                {(id) => (
                  <Input
                    id={id}
                    placeholder="결재 문서 제목"
                    aria-invalid={!!errors.title || undefined}
                    {...register("title")}
                  />
                )}
              </Field>
            </div>
            {form.fields.map((field) => {
              const error = errors.values?.[field.id]?.message;
              return (
                <div key={field.id} data-span={field.type === "textarea" ? "full" : undefined}>
                  <Field label={field.label} required={field.required} error={error}>
                    {(id) => (
                      <FieldControl id={id} field={field} invalid={!!error} {...register(`values.${field.id}`)} />
                    )}
                  </Field>
                </div>
              );
            })}
          </FormGrid>
        </Card>

        {errors.root && <ErrorText role="alert">{errors.root.message}</ErrorText>}
        <Row $justify="flex-end">
          <ButtonLink href="/dashboard/approval" $variant="secondary">
            취소
          </ButtonLink>
          <Button type="submit" disabled={steps.length === 0 || createDoc.isPending}>
            <Send />
            결재 상신
          </Button>
        </Row>
      </Stack>
    </form>
  );
}
