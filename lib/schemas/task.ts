import { z } from "zod";
import { TASK_PRIORITY, TASK_STATUS } from "@/lib/labels";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export const taskSchema = z.object({
  title: z.string().trim().min(1, "업무 제목을 입력하세요."),
  description: z.string().trim(),
  assigneeId: z.string(),
  priority: z.enum(Object.keys(TASK_PRIORITY) as [TaskPriority, ...TaskPriority[]]),
  dueDate: z.string(),
  status: z.enum(Object.keys(TASK_STATUS) as [TaskStatus, ...TaskStatus[]]),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
