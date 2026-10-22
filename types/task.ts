import type { ISODateString } from "./common";

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  createdBy: string;
  /** 기한이 없으면 "" */
  dueDate: string;
  createdAt: ISODateString;
}

export interface TaskListParams {
  /** mine: 내가 담당이거나 만든 업무 */
  scope?: "mine" | "all";
  assigneeId?: string;
  priority?: TaskPriority;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  /** ""이면 기한 없음 */
  dueDate?: string;
  status?: TaskStatus;
}

export type UpdateTaskRequest = Partial<CreateTaskRequest>;
