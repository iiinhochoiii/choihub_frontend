"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateReservationRequest, Room, RoomRequest, UpdateRoomRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { reservationsService, roomsService } from "@/apis/services/reservations";

// ───────── 회의실 ─────────

export function useRooms() {
  return useQuery({ queryKey: queryKeys.rooms, queryFn: roomsService.getList });
}

/** 회의실 변경은 예약 표시(회의실 이름·삭제)에도 영향을 준다. */
function useRoomMutation<TVariables, TData>(mutationFn: (variables: TVariables) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.rooms });
      void queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all });
    },
  });
}

export function useCreateRoom() {
  return useRoomMutation((body: RoomRequest) => roomsService.create(body));
}

export function useUpdateRoom() {
  return useRoomMutation(({ id, body }: { id: string; body: UpdateRoomRequest }) => roomsService.update(id, body));
}

export function useDeactivateRoom() {
  return useRoomMutation(({ id, reason }: { id: string; reason?: string }) => roomsService.deactivate(id, { reason }));
}

export function useActivateRoom() {
  return useRoomMutation((id: string) => roomsService.activate(id));
}

export function useDeleteRoom() {
  return useRoomMutation((id: string) => roomsService.remove(id));
}

/** 순서 변경은 바로 보이도록 캐시를 먼저 바꾸고, 실패하면 되돌린다. */
export function useReorderRooms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomIds: string[]) => roomsService.reorder({ roomIds }),
    onMutate: async (roomIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rooms });
      const previous = queryClient.getQueryData<Room[]>(queryKeys.rooms);
      if (previous) {
        const byId = new Map(previous.map((room) => [room.id, room]));
        queryClient.setQueryData(
          queryKeys.rooms,
          roomIds.map((id) => byId.get(id)).filter((room): room is Room => !!room),
        );
      }
      return { previous };
    },
    onError: (_error, _roomIds, context) => queryClient.setQueryData(queryKeys.rooms, context?.previous),
    onSuccess: (rooms) => queryClient.setQueryData(queryKeys.rooms, rooms),
  });
}

// ───────── 예약 ─────────

/** 날짜를 바꾸는 동안에는 이전 날짜 데이터를 유지해 시간표가 깜빡이지 않게 한다. */
export function useReservationsByDate(date: string) {
  return useQuery({
    queryKey: queryKeys.reservations.byDate(date),
    queryFn: () => reservationsService.getByDate(date),
    placeholderData: keepPreviousData,
  });
}

export function useMyReservations() {
  return useQuery({ queryKey: queryKeys.reservations.mine, queryFn: reservationsService.getMine });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReservationRequest) => reservationsService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationsService.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all }),
  });
}
