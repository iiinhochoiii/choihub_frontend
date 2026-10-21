"use client";

import styled from "@emotion/styled";
import { Lock, Trash2 } from "lucide-react";
import { useState } from "react";
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

type FormState = Pick<Task, "title" | "description" | "assigneeId" | "priority" | "dueDate" | "status">;

export function TaskFormModal({ task, currentUserId, canEdit, onClose }: Props) {
  const { data, update } = useData();
  const isNew = task === null;
  const readOnly = !isNew && !canEdit;

  const [form, setForm] = useState<FormState>(() => ({
    title: task?.title ?? "",
    description: task?.description ?? "",
    assigneeId: task?.assigneeId ?? currentUserId,
    priority: task?.priority ?? "medium",
    dueDate: task?.dueDate ?? todayKey(),
    status: task?.status ?? "todo",
  }));
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const title = form.title.trim();
    if (!title) return setError("업무 제목을 입력하세요.");

    const values = { ...form, title, description: form.description.trim() };
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
  };

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
        <form id="task-form" onSubmit={handleSubmit} noValidate>
          <fieldset disabled={readOnly} style={{ border: "none" }}>
            <FormGrid>
              <div data-span="full">
                <Field label="제목" required error={error}>
                  {(id) => (
                    <Input
                      id={id}
                      value={form.title}
                      autoFocus={isNew}
                      onChange={(e) => {
                        set("title", e.target.value);
                        setError(undefined);
                      }}
                      aria-invalid={!!error}
                    />
                  )}
                </Field>
              </div>
              <div data-span="full">
                <Field label="설명">
                  {(id) => (
                    <Textarea
                      id={id}
                      value={form.description}
                      placeholder="업무 내용을 입력하세요"
                      onChange={(e) => set("description", e.target.value)}
                    />
                  )}
                </Field>
              </div>
              <Field label="담당자" required>
                {(id) => (
                  <Select id={id} value={form.assigneeId} onChange={(e) => set("assigneeId", e.target.value)}>
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
                  <Select id={id} value={form.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
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
                  <Select id={id} value={form.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
                    {(Object.keys(TASK_PRIORITY) as TaskPriority[]).map((p) => (
                      <option key={p} value={p}>
                        {TASK_PRIORITY[p].label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="마감일">
                {(id) => <Input id={id} type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />}
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
