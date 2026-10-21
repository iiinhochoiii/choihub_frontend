"use client";

import styled from "@emotion/styled";
import { ArrowDown, ArrowUp, Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Button,
  CheckboxLabel,
  Field,
  FormGrid,
  IconButton,
  Input,
  Modal,
  Muted,
  Notice,
  Row,
  SectionTitle,
  Select,
  Stack,
  Textarea,
} from "@/components/ui";
import { createId } from "@/lib/id";
import { FORM_FIELD_TYPES } from "@/lib/labels";
import { getDepartmentName, getMember } from "@/lib/selectors";
import { useData } from "@/lib/store";
import type { ApprovalForm, FormField, FormFieldType } from "@/lib/types";

const ItemBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;

  @media (min-width: 640px) {
    grid-template-columns: 2fr 1.3fr 2fr;
  }
`;

const ApproverRow = styled.li`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};

  & + & {
    margin-top: 6px;
  }

  > span:first-of-type {
    width: 22px;
    font-size: 12px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  > div {
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

interface Draft {
  name: string;
  category: string;
  description: string;
  fields: FormField[];
  approverIds: string[];
}

interface FormEditorModalProps {
  open: boolean;
  form: ApprovalForm | null;
  onClose: () => void;
}

export function FormEditorModal({ open, form, onClose }: FormEditorModalProps) {
  if (!open) return null;
  // key로 대상 양식이 바뀔 때마다 편집 상태를 초기화한다.
  return <Editor key={form?.id ?? "new"} form={form} onClose={onClose} />;
}

function Editor({ form, onClose }: { form: ApprovalForm | null; onClose: () => void }) {
  const { data, update } = useData();
  const [draft, setDraft] = useState<Draft>(() => ({
    name: form?.name ?? "",
    category: form?.category ?? "",
    description: form?.description ?? "",
    fields: form?.fields ?? [{ id: createId("fld"), label: "", type: "text", required: true }],
    approverIds: form?.approverIds ?? [],
  }));
  const [candidate, setCandidate] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));
  const patchField = (id: string, next: Partial<FormField>) =>
    patch({ fields: draft.fields.map((f) => (f.id === id ? { ...f, ...next } : f)) });

  const available = data.members.filter((m) => !draft.approverIds.includes(m.id));

  const handleSave = () => {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "양식 이름을 입력하세요.";
    if (!draft.category.trim()) next.category = "카테고리를 입력하세요.";
    if (draft.fields.length === 0) next.fields = "입력 항목을 1개 이상 추가하세요.";
    else if (draft.fields.some((f) => !f.label.trim())) next.fields = "모든 입력 항목의 이름을 입력하세요.";
    if (draft.approverIds.length === 0) next.approvers = "결재자를 1명 이상 지정하세요.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const saved: ApprovalForm = {
      id: form?.id ?? createId("form"),
      name: draft.name.trim(),
      category: draft.category.trim(),
      description: draft.description.trim(),
      fields: draft.fields.map((f) => ({
        ...f,
        label: f.label.trim(),
        placeholder: f.placeholder?.trim() || undefined,
      })),
      approverIds: draft.approverIds,
      active: form?.active ?? true,
      updatedAt: new Date().toISOString(),
    };
    update((prev) => ({
      ...prev,
      approvalForms: form
        ? prev.approvalForms.map((f) => (f.id === saved.id ? saved : f))
        : [...prev.approvalForms, saved],
    }));
    onClose();
  };

  return (
    <Modal
      open
      title={form ? "결재 양식 수정" : "새 결재 양식"}
      onClose={onClose}
      width={760}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </>
      }
    >
      <Stack $gap={24}>
        {form && (
          <Notice>
            <Info />
            양식을 수정해도 이미 기안된 문서에는 영향을 주지 않습니다. (문서는 기안 당시 양식으로 보관됩니다)
          </Notice>
        )}

        <FormGrid>
          <Field label="양식 이름" required error={errors.name}>
            {(id) => (
              <Input
                id={id}
                value={draft.name}
                placeholder="예: 지출결의서"
                aria-invalid={!!errors.name || undefined}
                onChange={(e) => patch({ name: e.target.value })}
              />
            )}
          </Field>
          <Field label="카테고리" required error={errors.category}>
            {(id) => (
              <Input
                id={id}
                value={draft.category}
                placeholder="예: 재무, 인사, 총무"
                aria-invalid={!!errors.category || undefined}
                onChange={(e) => patch({ category: e.target.value })}
              />
            )}
          </Field>
          <div data-span="full">
            <Field label="설명">
              {(id) => (
                <Textarea
                  id={id}
                  value={draft.description}
                  style={{ minHeight: 72 }}
                  placeholder="양식 용도를 간단히 설명하세요."
                  onChange={(e) => patch({ description: e.target.value })}
                />
              )}
            </Field>
          </div>
        </FormGrid>

        <div>
          <Row $justify="space-between" style={{ marginBottom: 12 }}>
            <SectionTitle style={{ margin: 0 }}>입력 항목</SectionTitle>
            <Button
              $variant="secondary"
              $size="sm"
              onClick={() =>
                patch({
                  fields: [...draft.fields, { id: createId("fld"), label: "", type: "text", required: false }],
                })
              }
            >
              <Plus />
              항목 추가
            </Button>
          </Row>
          <Stack $gap={8}>
            {draft.fields.map((field, index) => (
              <ItemBox key={field.id}>
                <FieldRow>
                  <Input
                    value={field.label}
                    placeholder={`항목 ${index + 1} 이름`}
                    aria-label="항목 이름"
                    onChange={(e) => patchField(field.id, { label: e.target.value })}
                  />
                  <Select
                    value={field.type}
                    aria-label="입력 타입"
                    onChange={(e) => patchField(field.id, { type: e.target.value as FormFieldType })}
                  >
                    {Object.entries(FORM_FIELD_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={field.placeholder ?? ""}
                    placeholder="안내 문구 (선택)"
                    aria-label="안내 문구"
                    onChange={(e) => patchField(field.id, { placeholder: e.target.value })}
                  />
                </FieldRow>
                <Row $justify="space-between">
                  <CheckboxLabel>
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => patchField(field.id, { required: e.target.checked })}
                    />
                    필수 입력
                  </CheckboxLabel>
                  <Row $gap={2}>
                    <IconButton
                      aria-label="위로"
                      disabled={index === 0}
                      onClick={() => patch({ fields: move(draft.fields, index, -1) })}
                    >
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      aria-label="아래로"
                      disabled={index === draft.fields.length - 1}
                      onClick={() => patch({ fields: move(draft.fields, index, 1) })}
                    >
                      <ArrowDown />
                    </IconButton>
                    <IconButton
                      aria-label="항목 삭제"
                      onClick={() => patch({ fields: draft.fields.filter((f) => f.id !== field.id) })}
                    >
                      <Trash2 />
                    </IconButton>
                  </Row>
                </Row>
              </ItemBox>
            ))}
          </Stack>
          {errors.fields && <ErrorText style={{ marginTop: 8 }}>{errors.fields}</ErrorText>}
        </div>

        <div>
          <SectionTitle>결재선</SectionTitle>
          <Muted>위에서부터 순서대로 결재가 진행됩니다. 기안자가 결재선에 포함된 경우 해당 단계는 건너뜁니다.</Muted>
          <Row $wrap={false} style={{ margin: "12px 0" }}>
            <Select value={candidate} aria-label="결재자 선택" onChange={(e) => setCandidate(e.target.value)}>
              <option value="">결재자 선택</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.position} · {getDepartmentName(data, m.departmentId)}
                </option>
              ))}
            </Select>
            <Button
              $variant="secondary"
              disabled={!candidate}
              onClick={() => {
                patch({ approverIds: [...draft.approverIds, candidate] });
                setCandidate("");
              }}
            >
              <Plus />
              추가
            </Button>
          </Row>
          <ol>
            {draft.approverIds.map((approverId, index) => {
              const member = getMember(data, approverId);
              return (
                <ApproverRow key={approverId}>
                  <span>{index + 1}</span>
                  <Avatar name={member?.name ?? "?"} color={member?.color} size={30} />
                  <div>
                    <strong>{member?.name ?? "알 수 없음"}</strong>
                    <small>
                      {member ? `${member.position} · ${getDepartmentName(data, member.departmentId)}` : "-"}
                    </small>
                  </div>
                  <IconButton
                    aria-label="위로"
                    disabled={index === 0}
                    onClick={() => patch({ approverIds: move(draft.approverIds, index, -1) })}
                  >
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    aria-label="아래로"
                    disabled={index === draft.approverIds.length - 1}
                    onClick={() => patch({ approverIds: move(draft.approverIds, index, 1) })}
                  >
                    <ArrowDown />
                  </IconButton>
                  <IconButton
                    aria-label="결재자 제거"
                    onClick={() => patch({ approverIds: draft.approverIds.filter((id) => id !== approverId) })}
                  >
                    <Trash2 />
                  </IconButton>
                </ApproverRow>
              );
            })}
          </ol>
          {errors.approvers && <ErrorText style={{ marginTop: 8 }}>{errors.approvers}</ErrorText>}
        </div>
      </Stack>
    </Modal>
  );
}
