"use client";

import styled from "@emotion/styled";
import { Lock, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  ConfirmModal,
  Field,
  FormGrid,
  Input,
  Modal,
  Notice,
  Select,
  Textarea,
} from "@/components/ui";
import { formatDateTime, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/labels";
import { type TaskFormValues, taskSchema } from "@/lib/schemas/task";
import { getMemberName } from "@/lib/selectors";
import { useData } from "@/lib/store";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

const Meta = styled.p`
  margin-top: 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const Spacer = styled.span`
  flex: 1;
`;

interface Props {
  /** null이면 신규 */
  task: Task | null;
  currentUserId: string;
  canEdit: boolean;
  onClose: () => void;
}

export function TaskFormModal({ task, currentUserId, canEdit, onClose }: Props) {
  const { data, update } = useData();
  const isNew = task === null;
  const readOnly = !isNew && !canEdit;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      assigneeId: task?.assigneeId ?? currentUserId,
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ?? todayKey(),
      status: task?.status ?? "todo",
    },
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = handleSubmit((values) => {
    if (readOnly) return;
    update((prev) => ({
      ...prev,
      tasks: task
        ? prev.tasks.map((t) => (t.id === task.id ? { ...t, ...values } : t))
        : [
            ...prev.tasks,
            {
              ...values,
              id: createId("t"),
              createdBy: currentUserId,
              createdAt: new Date().toISOString(),
            },
          ],
    }));
    onClose();
  });

  const handleDelete = () => {
    if (!task) return;
    update((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== task.id) }));
    onClose();
  };

  const members = [...data.members].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  return (
    <>
      <Modal
        open
        title={isNew ? "업무 추가" : readOnly ? "업무 상세" : "업무 수정"}
        onClose={onClose}
        width={560}
        footer={
          readOnly ? (
            <Button $variant="secondary" onClick={onClose}>
              닫기
            </Button>
          ) : (
            <>
              {!isNew && (
                <Button $variant="ghost" onClick={() => setConfirmDelete(true)}>
                  <Trash2 />
                  삭제
                </Button>
              )}
              <Spacer />
              <Button $variant="secondary" onClick={onClose}>
                취소
              </Button>
              <Button type="submit" form="task-form">
                {isNew ? "추가" : "저장"}
              </Button>
            </>
          )
        }
      >
        {readOnly && (
          <Notice>
            <Lock />
            작성자, 담당자 또는 매니저만 수정할 수 있습니다.
          </Notice>
        )}
        <form id="task-form" onSubmit={submit} noValidate>
          <fieldset disabled={readOnly} style={{ border: "none" }}>
            <FormGrid>
              <div data-span="full">
                <Field label="제목" required error={errors.title?.message}>
                  {(id) => (
                    <Input id={id} autoFocus={isNew} aria-invalid={!!errors.title} {...register("title")} />
                  )}
                </Field>
              </div>
              <div data-span="full">
                <Field label="설명">
                  {(id) => (
                    <Textarea id={id} placeholder="업무 내용을 입력하세요" {...register("description")} />
                  )}
                </Field>
              </div>
              <Field label="담당자" required>
                {(id) => (
                  <Select id={id} {...register("assigneeId")}>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.position}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="상태" required>
                {(id) => (
                  <Select id={id} {...register("status")}>
                    {(Object.keys(TASK_STATUS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {TASK_STATUS[s].label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="우선순위" required>
                {(id) => (
                  <Select id={id} {...register("priority")}>
                    {(Object.keys(TASK_PRIORITY) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>
                        {TASK_PRIORITY[p].label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="마감일">
                {(id) => <Input id={id} type="date" {...register("dueDate")} />}
              </Field>
            </FormGrid>
          </fieldset>
        </form>
        {task && (
          <Meta>
            {getMemberName(data, task.createdBy)} 님이 {formatDateTime(task.createdAt)}에 등록
          </Meta>
        )}
      </Modal>
      <ConfirmModal
        open={confirmDelete}
        title="업무 삭제"
        message={`'${task?.title ?? ""}' 업무를 삭제할까요?\n삭제한 업무는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
