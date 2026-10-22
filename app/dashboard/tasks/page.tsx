"use client";

import styled from "@emotion/styled";
import { Plus } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import { isOverdue, TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import {
  Button,
  ChipGroup,
  ErrorState,
  LoadingState,
  Muted,
  PageHeader,
  Row,
  Select,
  Toolbar,
} from "@/components/ui";
import { TASK_PRIORITY } from "@/lib/labels";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { useTasks, useUpdateTask } from "@/queries/tasks";
import type { Task, TaskListParams, TaskPriority, TaskStatus } from "@/types";

const FilterSelect = styled(Select)`
  width: auto;
  min-width: 130px;
`;

const ErrorText = styled.p`
  margin-bottom: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

type Scope = "mine" | "all";
type ModalState = { taskId: string | null } | null;

export default function TasksPage() {
  const user = useCurrentUser();
  const { members } = useDirectory();
  const [scope, setScope] = useState<Scope>("mine");
  const [assigneeId, setAssigneeId] = useState("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [modal, setModal] = useState<ModalState>(null);

  const canEdit = (task: Task) => user.isManager || task.createdBy === user.id || task.assigneeId === user.id;

  // 담당자·우선순위 필터는 서버에서 한다. mine은 내가 담당자인 업무
  const params: TaskListParams = {
    scope,
    ...(scope === "all" && assigneeId !== "all" && { assigneeId }),
    ...(priority !== "all" && { priority }),
  };
  const { data, isPending, error, refetch } = useTasks(params);
  // 상태 이동은 낙관적으로 바로 반영하고, 실패하면 되돌린 뒤 오류를 보여 준다.
  const updateTask = useUpdateTask();
  const tasks = data ?? [];

  const overdueCount = tasks.filter(isOverdue).length;

  const handleMove = (taskId: string, status: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status || !canEdit(task)) return;
    updateTask.mutate({ id: taskId, body: { status } });
  };

  const editingTask = modal?.taskId ? (tasks.find((t) => t.id === modal.taskId) ?? null) : null;

  return (
    <>
      <PageHeader
        title="업무관리"
        description="업무를 칸반 보드로 관리합니다. 카드를 끌어 상태를 바꿀 수 있습니다."
        actions={
          <Button onClick={() => setModal({ taskId: null })}>
            <Plus />
            업무 추가
          </Button>
        }
      />

      <Toolbar>
        <Row $gap={8}>
          <ChipGroup
            items={[
              { value: "mine", label: "내 업무" },
              { value: "all", label: "전체" },
            ]}
            value={scope}
            onChange={setScope}
          />
          {scope === "all" && (
            <FilterSelect
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              aria-label="담당자"
            >
              <option value="all">전체 담당자</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </FilterSelect>
          )}
          <FilterSelect
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority | "all")}
            aria-label="우선순위"
          >
            <option value="all">전체 우선순위</option>
            {(Object.keys(TASK_PRIORITY) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY[p].label}
              </option>
            ))}
          </FilterSelect>
        </Row>
        <Muted>
          총 {tasks.length}건{overdueCount > 0 && ` · 지연 ${overdueCount}건`}
        </Muted>
      </Toolbar>

      {updateTask.error && <ErrorText role="alert">{getErrorMessage(updateTask.error)}</ErrorText>}

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <TaskBoard
          tasks={tasks}
          canEdit={canEdit}
          onOpen={(task) => {
            updateTask.reset();
            setModal({ taskId: task.id });
          }}
          onMove={handleMove}
        />
      )}

      {modal && (
        <TaskFormModal
          key={modal.taskId ?? "new"}
          task={editingTask}
          currentUserId={user.id}
          canEdit={editingTask ? canEdit(editingTask) : true}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
