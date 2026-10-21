"use client";

import styled from "@emotion/styled";
import { ArrowLeft, FileText, Info, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  Field,
  FormGrid,
  Input,
  Muted,
  Notice,
  PageHeader,
  Row,
  SectionTitle,
  Stack,
} from "@/components/ui";
import { buildSteps, nextDocNumber } from "@/lib/approval";
import { createId } from "@/lib/id";
import { useCurrentUser, useData } from "@/lib/store";
import type { ApprovalDocument, ApprovalForm } from "@/lib/types";

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
  const { data } = useData();
  const forms = data.approvalForms.filter((f) => f.active);
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
  const { data, update } = useData();
  const user = useCurrentUser();
  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = buildSteps(form, user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = "제목을 입력하세요.";
    for (const field of form.fields) {
      if (field.required && !values[field.id]?.trim()) next[field.id] = `${field.label}을(를) 입력하세요.`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0 || steps.length === 0) return;

    const doc: ApprovalDocument = {
      id: createId("doc"),
      docNumber: nextDocNumber(data.approvalDocs),
      formId: form.id,
      formName: form.name,
      title: title.trim(),
      fields: form.fields,
      values,
      drafterId: user.id,
      createdAt: new Date().toISOString(),
      status: "in_progress",
      steps,
    };
    update((prev) => ({ ...prev, approvalDocs: [doc, ...prev.approvalDocs] }));
    router.push(`/dashboard/approval/${doc.id}`);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
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
              <Field label="제목" required error={errors.title}>
                {(id) => (
                  <Input
                    id={id}
                    value={title}
                    placeholder="결재 문서 제목"
                    aria-invalid={!!errors.title || undefined}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                )}
              </Field>
            </div>
            {form.fields.map((field) => (
              <div key={field.id} data-span={field.type === "textarea" ? "full" : undefined}>
                <Field label={field.label} required={field.required} error={errors[field.id]}>
                  {(id) => (
                    <FieldControl
                      id={id}
                      field={field}
                      value={values[field.id] ?? ""}
                      invalid={!!errors[field.id]}
                      onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))}
                    />
                  )}
                </Field>
              </div>
            ))}
          </FormGrid>
        </Card>

        <Row $justify="flex-end">
          <ButtonLink href="/dashboard/approval" $variant="secondary">
            취소
          </ButtonLink>
          <Button type="submit" disabled={steps.length === 0}>
            <Send />
            결재 상신
          </Button>
        </Row>
      </Stack>
    </form>
  );
}
