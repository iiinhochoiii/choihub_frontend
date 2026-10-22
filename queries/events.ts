"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateEventRequest, EventListParams } from "@/types";
import { queryKeys } from "./queryKeys";
import { eventsService } from "@/apis/services/events";

export function useEvents(params?: EventListParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventsService.getList(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateEventRequest) => eventsService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.events.all }),
  });
}
