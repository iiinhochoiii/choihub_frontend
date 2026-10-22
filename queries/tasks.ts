"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTaskRequest, Task, TaskListParams, UpdateTaskRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { tasksService } from "@/apis/services/tasks";

export function useTasks(params?: TaskListParams) {
  return useQuery({ queryKey: queryKeys.tasks.list(params), queryFn: () => tasksService.getList(params) });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTaskRequest) => tasksService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

/**
 * 업무 수정. 칸반에서 상태를 옮길 때 바로 반영되도록 목록 캐시를 먼저 고치고(낙관적 업데이트),
 * 실패하면 이전 값으로 되돌린다.
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskRequest }) => tasksService.update(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const snapshot = queryClient.getQueriesData<Task[]>({ queryKey: queryKeys.tasks.all });
      queryClient.setQueriesData<Task[]>({ queryKey: queryKeys.tasks.all }, (prev) =>
        prev?.map((task) => (task.id === id ? { ...task, ...body } : task)),
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }),
  });
}
