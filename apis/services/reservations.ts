import { defaultInstance } from "../defaultInstance";
import type {
  CreateReservationRequest,
  DeactivateRoomRequest,
  ReorderRoomsRequest,
  Reservation,
  Room,
  RoomRequest,
  UpdateRoomRequest,
} from "@/types";

/** 회의실 (조회는 전원, 관리는 매니저). 목록은 표시 순서대로 온다. */
export const roomsService = {
  getList: () => defaultInstance.get<Room[]>("/rooms").then((r) => r.data),

  create: (body: RoomRequest) => defaultInstance.post<Room>("/rooms", body).then((r) => r.data),

  update: (id: string, body: UpdateRoomRequest) =>
    defaultInstance.patch<Room>(`/rooms/${id}`, body).then((r) => r.data),

  /** 전체 회의실 id를 새 순서대로 보낸다. */
  reorder: (body: ReorderRoomsRequest) => defaultInstance.put<Room[]>("/rooms/order", body).then((r) => r.data),

  deactivate: (id: string, body: DeactivateRoomRequest) =>
    defaultInstance.post<Room>(`/rooms/${id}/deactivate`, body).then((r) => r.data),

  activate: (id: string) => defaultInstance.post<Room>(`/rooms/${id}/activate`).then((r) => r.data),

  /** 끝나지 않은 예약이 있으면 409 */
  remove: (id: string) => defaultInstance.delete<void>(`/rooms/${id}`).then(() => undefined),
};

export const reservationsService = {
  /** 해당 날짜의 전체 예약 */
  getByDate: (date: string) =>
    defaultInstance.get<Reservation[]>("/reservations", { params: { date } }).then((r) => r.data),

  getMine: () => defaultInstance.get<Reservation[]>("/reservations/me").then((r) => r.data),

  create: (body: CreateReservationRequest) =>
    defaultInstance.post<Reservation>("/reservations", body).then((r) => r.data),

  cancel: (id: string) => defaultInstance.delete<void>(`/reservations/${id}`).then(() => undefined),
};
