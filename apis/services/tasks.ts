import { defaultInstance } from "../defaultInstance";
import type { CreateTaskRequest, Task, TaskListParams, UpdateTaskRequest } from "@/types";

export const tasksService = {
  getList: (params?: TaskListParams) => defaultInstance.get<Task[]>("/tasks", { params }).then((r) => r.data),

  create: (body: CreateTaskRequest) => defaultInstance.post<Task>("/tasks", body).then((r) => r.data),

  update: (id: string, body: UpdateTaskRequest) =>
    defaultInstance.patch<Task>(`/tasks/${id}`, body).then((r) => r.data),

  remove: (id: string) => defaultInstance.delete<void>(`/tasks/${id}`).then(() => undefined),
};
