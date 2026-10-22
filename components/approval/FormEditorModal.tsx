"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDown, ArrowUp, Info, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useController, useFieldArray, useForm } from "react-hook-form";
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
import { getErrorMessage } from "@/apis/defaultInstance";
import { setServerErrors } from "@/lib/form";
import { FORM_FIELD_TYPES } from "@/lib/labels";
import { type ApprovalFormInput, type ApprovalFormValues, approvalFormSchema } from "@/lib/schemas/approval";
import { useCreateApprovalForm, useUpdateApprovalForm } from "@/queries/approval";
import { useDirectory } from "@/queries/directory";
import type { ApprovalForm } from "@/types";
import { UNKNOWN_MEMBER_NAME } from "@/lib/selectors";

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
  const { members, getMember, getDepartmentName } = useDirectory();
  const createForm = useCreateApprovalForm();
  const updateForm = useUpdateApprovalForm();
  const saving = createForm.isPending || updateForm.isPending;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ApprovalFormInput, unknown, ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      name: form?.name ?? "",
      category: form?.category ?? "",
      description: form?.description ?? "",
      // 기존 항목은 id를 그대로 보내 문서 값과의 연결을 유지하고, 새 항목은 id 없이 보내 서버가 만든다.
      fields: form?.fields ?? [{ label: "", type: "text", required: true }],
      approverIds: form?.approverIds ?? [],
    },
  });
  const { fields, append, remove, swap } = useFieldArray({ control, name: "fields" });
  const {
    field: { value: approverIds, onChange: setApproverIds },
    fieldState: { error: approversError },
  } = useController({ control, name: "approverIds" });
  const [candidate, setCandidate] = useState("");

  const available = members.filter((m) => !approverIds.includes(m.id));
  // 항목 수 오류는 배열 자체에, 항목 이름 오류는 각 항목에 붙는다. 기존처럼 하나만 보여 준다.
  const fieldsError =
    errors.fields?.root?.message ??
    errors.fields?.message ??
    fields
      .map((_, index) => {
        const item = errors.fields?.[index];
        return item?.label?.message ?? item?.type?.message ?? item?.placeholder?.message;
      })
      .find(Boolean);

  const handleSave = handleSubmit((values) => {
    const options = {
      onSuccess: onClose,
      onError: (err: unknown) => {
        // 서버 경로("fields.0.label", "approverIds")가 폼 이름과 같다. 배열 자체 오류만 root로 옮긴다.
        const applied = setServerErrors(err, setError, (path) => (path === "fields" ? "fields.root" : path));
        if (!applied) setError("root", { message: getErrorMessage(err) });
      },
    };
    if (form) updateForm.mutate({ id: form.id, body: values }, options);
    else createForm.mutate(values, options);
  });

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
          <Button disabled={saving} onClick={handleSave}>
            저장
          </Button>
        </>
      }
    >
      <Stack $gap={24}>
        {errors.root && <ErrorText role="alert">{errors.root.message}</ErrorText>}
        {form && (
          <Notice>
            <Info />
            양식을 수정해도 이미 기안된 문서에는 영향을 주지 않습니다. (문서는 기안 당시 양식으로 보관됩니다)
          </Notice>
        )}

        <FormGrid>
          <Field label="양식 이름" required error={errors.name?.message}>
            {(id) => (
              <Input
                id={id}
                placeholder="예: 지출결의서"
                aria-invalid={!!errors.name || undefined}
                {...register("name")}
              />
            )}
          </Field>
          <Field label="카테고리" required error={errors.category?.message}>
            {(id) => (
              <Input
                id={id}
                placeholder="예: 재무, 인사, 총무"
                aria-invalid={!!errors.category || undefined}
                {...register("category")}
              />
            )}
          </Field>
          <div data-span="full">
            <Field label="설명" error={errors.description?.message}>
              {(id) => (
                <Textarea
                  id={id}
                  style={{ minHeight: 72 }}
                  placeholder="양식 용도를 간단히 설명하세요."
                  {...register("description")}
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
              onClick={() => append({ label: "", type: "text", required: false })}
            >
              <Plus />
              항목 추가
            </Button>
          </Row>
          <Stack $gap={8}>
            {fields.map((field, index) => (
              <ItemBox key={field.id}>
                <FieldRow>
                  <Input
                    placeholder={`항목 ${index + 1} 이름`}
                    aria-label="항목 이름"
                    aria-invalid={!!errors.fields?.[index]?.label || undefined}
                    {...register(`fields.${index}.label`)}
                  />
                  <Select aria-label="입력 타입" {...register(`fields.${index}.type`)}>
                    {Object.entries(FORM_FIELD_TYPES).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    placeholder="안내 문구 (선택)"
                    aria-label="안내 문구"
                    {...register(`fields.${index}.placeholder`)}
                  />
                </FieldRow>
                <Row $justify="space-between">
                  <CheckboxLabel>
                    <input type="checkbox" {...register(`fields.${index}.required`)} />
                    필수 입력
                  </CheckboxLabel>
                  <Row $gap={2}>
                    <IconButton aria-label="위로" disabled={index === 0} onClick={() => swap(index, index - 1)}>
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      aria-label="아래로"
                      disabled={index === fields.length - 1}
                      onClick={() => swap(index, index + 1)}
                    >
                      <ArrowDown />
                    </IconButton>
                    <IconButton aria-label="항목 삭제" onClick={() => remove(index)}>
                      <Trash2 />
                    </IconButton>
                  </Row>
                </Row>
              </ItemBox>
            ))}
          </Stack>
          {fieldsError && <ErrorText style={{ marginTop: 8 }}>{fieldsError}</ErrorText>}
        </div>

        <div>
          <SectionTitle>결재선</SectionTitle>
          <Muted>위에서부터 순서대로 결재가 진행됩니다. 기안자가 결재선에 포함된 경우 해당 단계는 건너뜁니다.</Muted>
          <Row $wrap={false} style={{ margin: "12px 0" }}>
            <Select value={candidate} aria-label="결재자 선택" onChange={(e) => setCandidate(e.target.value)}>
              <option value="">결재자 선택</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.position} · {getDepartmentName(m.departmentId)}
                </option>
              ))}
            </Select>
            <Button
              $variant="secondary"
              disabled={!candidate}
              onClick={() => {
                setApproverIds([...approverIds, candidate]);
                setCandidate("");
              }}
            >
              <Plus />
              추가
            </Button>
          </Row>
          <ol>
            {approverIds.map((approverId, index) => {
              const member = getMember(approverId);
              return (
                <ApproverRow key={approverId}>
                  <span>{index + 1}</span>
                  <Avatar name={member?.name ?? "?"} color={member?.color} size={30} />
                  <div>
                    <strong>{member?.name ?? UNKNOWN_MEMBER_NAME}</strong>
                    <small>
                      {member ? `${member.position} · ${getDepartmentName(member.departmentId)}` : "-"}
                    </small>
                  </div>
                  <IconButton
                    aria-label="위로"
                    disabled={index === 0}
                    onClick={() => setApproverIds(move(approverIds, index, -1))}
                  >
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    aria-label="아래로"
                    disabled={index === approverIds.length - 1}
                    onClick={() => setApproverIds(move(approverIds, index, 1))}
                  >
                    <ArrowDown />
                  </IconButton>
                  <IconButton
                    aria-label="결재자 제거"
                    onClick={() => setApproverIds(approverIds.filter((id) => id !== approverId))}
                  >
                    <Trash2 />
                  </IconButton>
                </ApproverRow>
              );
            })}
          </ol>
          {approversError && <ErrorText style={{ marginTop: 8 }}>{approversError.message}</ErrorText>}
        </div>
      </Stack>
    </Modal>
  );
}
