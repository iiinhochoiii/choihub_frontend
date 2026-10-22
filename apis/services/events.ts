import { defaultInstance } from "../defaultInstance";
import type { CalendarEvent, CreateEventRequest, EventListParams } from "@/types";

/** 내 일정 + 공유 일정 */
export const eventsService = {
  getList: (params?: EventListParams) =>
    defaultInstance.get<CalendarEvent[]>("/events", { params }).then((r) => r.data),

  create: (body: CreateEventRequest) => defaultInstance.post<CalendarEvent>("/events", body).then((r) => r.data),

  remove: (id: string) => defaultInstance.delete<void>(`/events/${id}`).then(() => undefined),
};
