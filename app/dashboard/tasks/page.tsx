"use client";

import styled from "@emotion/styled";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { isOverdue, TaskBoard } from "@/components/tasks/TaskBoard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { Button, ChipGroup, Muted, PageHeader, Row, Select, Toolbar } from "@/components/ui";
import { TASK_PRIORITY } from "@/lib/labels";
import { useCurrentUser, useData } from "@/lib/store";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

const FilterSelect = styled(Select)`
  width: auto;
  min-width: 130px;
`;

type Scope = "mine" | "all";
type ModalState = { taskId: string | null } | null;

export default function TasksPage() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [scope, setScope] = useState<Scope>("mine");
  const [assigneeId, setAssigneeId] = useState("all");
  const [priority, setPriority] = useState<TaskPriority | "all">("all");
  const [modal, setModal] = useState<ModalState>(null);

  const canEdit = (task: Task) =>
    user.isManager || task.createdBy === user.id || task.assigneeId === user.id;

  const tasks = useMemo(
    () =>
      data.tasks
        .filter((t) => (scope === "mine" ? t.assigneeId === user.id : assigneeId === "all" || t.assigneeId === assigneeId))
        .filter((t) => priority === "all" || t.priority === priority),
    [data.tasks, scope, assigneeId, priority, user.id],
  );

  const overdueCount = tasks.filter(isOverdue).length;

  const handleMove = (taskId: string, status: TaskStatus) => {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task || task.status === status || !canEdit(task)) return;
    update((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
  };

  const editingTask = modal?.taskId ? (data.tasks.find((t) => t.id === modal.taskId) ?? null) : null;

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
            <FilterSelect value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} aria-label="담당자">
              <option value="all">전체 담당자</option>
              {data.members.map((m) => (
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

      <TaskBoard
        data={data}
        tasks={tasks}
        canEdit={canEdit}
        onOpen={(task) => setModal({ taskId: task.id })}
        onMove={handleMove}
      />

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
