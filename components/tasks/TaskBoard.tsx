"use client";

import styled from "@emotion/styled";
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { Avatar, Badge, StatusBadge, transientOptions } from "@/components/ui";
import { formatMonthDay, todayKey } from "@/lib/date";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/labels";
import { useDirectory } from "@/queries/directory";
import type { Task, TaskStatus } from "@/types";

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const Column = styled("section", transientOptions)<{ $over: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 320px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border: 1px dashed ${({ theme, $over }) => ($over ? theme.colors.primary : "transparent")};
  transition:
    border-color 0.15s,
    background-color 0.15s;

  ${({ theme, $over }) => $over && `background: ${theme.colors.primarySoft};`}
`;

const ColumnHeader = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 6px;

  span {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const CardButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding: 12px;
  text-align: left;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition:
    border-color 0.15s,
    opacity 0.15s;

  &[draggable="true"] {
    cursor: grab;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &[data-dragging="true"] {
    opacity: 0.4;
  }

  strong {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  &[data-done="true"] strong {
    color: ${({ theme }) => theme.colors.textMuted};
    text-decoration: line-through;
  }
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Due = styled("span", transientOptions)<{ $overdue: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: ${({ $overdue }) => ($overdue ? 600 : 400)};
  color: ${({ theme, $overdue }) => ($overdue ? theme.colors.danger : theme.colors.textMuted)};

  svg {
    width: 13px;
    height: 13px;
  }
`;

const EmptyColumn = styled.p`
  padding: 24px 8px;
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

export function isOverdue(task: Task): boolean {
  return task.status !== "done" && !!task.dueDate && task.dueDate < todayKey();
}

interface TaskBoardProps {
  tasks: Task[];
  canEdit: (task: Task) => boolean;
  onOpen: (task: Task) => void;
  onMove: (taskId: string, status: TaskStatus) => void;
}

export function TaskBoard({ tasks, canEdit, onOpen, onMove }: TaskBoardProps) {
  const { getMember } = useDirectory();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<TaskStatus | null>(null);

  const statuses = Object.keys(TASK_STATUS) as TaskStatus[];

  return (
    <Board>
      {statuses.map((status) => {
        const items = tasks
          .filter((t) => t.status === status)
          .sort(
            (a, b) =>
              PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
              (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
          );
        return (
          <Column
            key={status}
            aria-label={TASK_STATUS[status].label}
            $over={overStatus === status}
            onDragOver={(e) => {
              if (!draggingId) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (overStatus !== status) setOverStatus(status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStatus(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (id) onMove(id, status);
              setOverStatus(null);
              setDraggingId(null);
            }}
          >
            <ColumnHeader>
              <StatusBadge value={TASK_STATUS[status]} />
              <span>{items.length}</span>
            </ColumnHeader>

            {items.length === 0 && <EmptyColumn>업무가 없습니다</EmptyColumn>}

            {items.map((task) => {
              const assignee = getMember(task.assigneeId);
              const draggable = canEdit(task);
              const overdue = isOverdue(task);
              return (
                <CardButton
                  key={task.id}
                  type="button"
                  draggable={draggable}
                  data-dragging={draggingId === task.id}
                  data-done={task.status === "done"}
                  onClick={() => onOpen(task)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", task.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverStatus(null);
                  }}
                >
                  <strong>{task.title}</strong>
                  <CardMeta>
                    <Badge $tone={TASK_PRIORITY[task.priority].tone}>
                      {TASK_PRIORITY[task.priority].label}
                    </Badge>
                    {task.dueDate && (
                      <Due $overdue={overdue}>
                        <CalendarClock />
                        {formatMonthDay(task.dueDate)}
                        {overdue && " · 지연"}
                      </Due>
                    )}
                  </CardMeta>
                  {assignee && (
                    <CardMeta>
                      <Due $overdue={false}>
                        <Avatar name={assignee.name} color={assignee.color} size={22} />
                        {assignee.name}
                      </Due>
                    </CardMeta>
                  )}
                </CardButton>
              );
            })}
          </Column>
        );
      })}
    </Board>
  );
}
