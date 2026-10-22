"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Undo2, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  Muted,
  PageHeader,
  Person,
  Row,
  SectionTitle,
  Stack,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { applyDecision, canWithdraw, isMyTurn } from "@/lib/approval";
import { formatDateTime } from "@/lib/date";
import { APPROVAL_DOC_STATUS, APPROVAL_STEP_STATUS } from "@/lib/labels";
import { type ApprovalDecisionFormValues, approvalDecisionSchema } from "@/lib/schemas/approval";
import { getMember, getMemberSummary } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { ApprovalDocument } from "@/lib/types";
import { ApprovalLine } from "./ApprovalLine";
import { formatFieldValue } from "./fieldValue";

const Meta = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px 24px;

  dt {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  dd {
    margin-top: 2px;
    font-weight: 500;
  }
`;

const Values = styled.dl`
  display: grid;
  grid-template-columns: 1fr;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;

  @media (min-width: 640px) {
    grid-template-columns: 160px 1fr;
  }

  dt,
  dd {
    padding: 12px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  dt {
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  dd {
    white-space: pre-wrap;
    word-break: break-word;
  }

  > div {
    display: contents;
  }

  > div:last-of-type > dd {
    border-bottom: none;
  }

  @media (min-width: 640px) {
    > div:last-of-type > dt {
      border-bottom: none;
    }
  }
`;

const History = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 14px;

  li {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  li:last-of-type {
    padding-bottom: 0;
    border-bottom: none;
  }

  p {
    white-space: pre-wrap;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export function ApprovalDetail({ id }: { id: string }) {
  const { data, update } = useData();
  const user = useCurrentUser();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ApprovalDecisionFormValues>({
    resolver: zodResolver(approvalDecisionSchema),
    defaultValues: { decision: "approved", comment: "" },
  });
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const doc = data.approvalDocs.find((d) => d.id === id);

  if (!doc) {
    return (
      <Card>
        <EmptyState
          title="문서를 찾을 수 없습니다."
          description="삭제되었거나 잘못된 주소입니다."
          action={
            <ButtonLink href="/dashboard/approval" $variant="secondary" $size="sm">
              목록으로
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  const myTurn = isMyTurn(doc, user.id);
  const withdrawable = canWithdraw(doc, user.id);
  const drafter = getMember(data, doc.drafterId);
  const actedSteps = doc.steps.filter((s) => s.actedAt);

  const saveDoc = (next: ApprovalDocument) =>
    update((prev) => ({
      ...prev,
      approvalDocs: prev.approvalDocs.map((d) => (d.id === next.id ? next : d)),
    }));

  const submitDecision = handleSubmit(({ decision, comment }) => {
    saveDoc(applyDecision(doc, user.id, decision, comment));
    reset();
  });

  /** 누른 버튼(승인/반려)을 폼 값으로 넣고 제출한다. 반려 의견 필수 여부는 스키마가 검사한다. */
  const decide = (decision: ApprovalDecisionFormValues["decision"]) => {
    setValue("decision", decision);
    void submitDecision();
  };

  return (
    <>
      <PageHeader
        title={doc.title}
        description={`${doc.docNumber} · ${doc.formName}`}
        actions={
          <>
            {withdrawable && (
              <Button $variant="secondary" onClick={() => setConfirmWithdraw(true)}>
                <Undo2 />
                회수
              </Button>
            )}
            <ButtonLink href="/dashboard/approval" $variant="secondary">
              <ArrowLeft />
              목록으로
            </ButtonLink>
          </>
        }
      />

      <Stack $gap={16}>
        <Card>
          <Row $justify="space-between" $gap={16} style={{ alignItems: "flex-start" }}>
            <Meta style={{ flex: "1 1 320px" }}>
              <div>
                <dt>상태</dt>
                <dd>
                  <StatusBadge value={APPROVAL_DOC_STATUS[doc.status]} />
                </dd>
              </div>
              <div>
                <dt>양식</dt>
                <dd>{doc.formName}</dd>
              </div>
              <div>
                <dt>기안자</dt>
                <dd>{getMemberSummary(data, doc.drafterId)}</dd>
              </div>
              <div>
                <dt>기안일시</dt>
                <dd>{formatDateTime(doc.createdAt)}</dd>
              </div>
            </Meta>
            <ApprovalLine drafterId={doc.drafterId} draftedAt={doc.createdAt} steps={doc.steps} />
          </Row>
        </Card>

        <Card>
          <SectionTitle>문서 내용</SectionTitle>
          <Values>
            {doc.fields.map((field) => (
              <div key={field.id}>
                <dt>{field.label}</dt>
                <dd>{formatFieldValue(field, doc.values[field.id])}</dd>
              </div>
            ))}
          </Values>
        </Card>

        {myTurn && (
          <Card>
            <SectionTitle>결재 처리</SectionTitle>
            <Stack $gap={12}>
              <Field label="결재 의견" hint="반려 시에는 의견을 반드시 입력하세요." error={errors.comment?.message}>
                {(fid) => (
                  <Textarea
                    id={fid}
                    placeholder="의견을 입력하세요 (선택)"
                    style={{ minHeight: 88 }}
                    aria-invalid={!!errors.comment || undefined}
                    {...register("comment")}
                  />
                )}
              </Field>
              <Row $justify="flex-end">
                <Button $variant="danger" onClick={() => decide("rejected")}>
                  <X />
                  반려
                </Button>
                <Button onClick={() => decide("approved")}>
                  <Check />
                  승인
                </Button>
              </Row>
            </Stack>
          </Card>
        )}

        <Card>
          <SectionTitle>결재 이력</SectionTitle>
          <History>
            <li>
              <Row $justify="space-between">
                <Person name={drafter?.name ?? "알 수 없음"} color={drafter?.color} caption="기안" />
                <Muted>{formatDateTime(doc.createdAt)}</Muted>
              </Row>
            </li>
            {actedSteps.map((step, index) => {
              const member = getMember(data, step.approverId);
              return (
                <li key={`${step.approverId}-${index}`}>
                  <Row $justify="space-between">
                    <Row>
                      <Person name={member?.name ?? "알 수 없음"} color={member?.color} caption={member?.position} />
                      <StatusBadge value={APPROVAL_STEP_STATUS[step.status]} />
                    </Row>
                    <Muted>{step.actedAt && formatDateTime(step.actedAt)}</Muted>
                  </Row>
                  {step.comment && <p>{step.comment}</p>}
                </li>
              );
            })}
            {doc.status === "withdrawn" && (
              <li>
                <Row>
                  <Badge>회수</Badge>
                  <Muted>기안자가 문서를 회수했습니다.</Muted>
                </Row>
              </li>
            )}
          </History>
        </Card>
      </Stack>

      <ConfirmModal
        open={confirmWithdraw}
        title="문서 회수"
        message="결재 진행을 중단하고 문서를 회수합니다. 계속하시겠습니까?"
        confirmLabel="회수"
        danger
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={() =>
          saveDoc({
            ...doc,
            status: "withdrawn",
            steps: doc.steps.map((s) => (s.status === "pending" ? { ...s, status: "waiting" } : s)),
          })
        }
      />
    </>
  );
}
