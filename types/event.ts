export type EventCategory = "meeting" | "personal" | "company" | "trip";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  startTime: string; // HH:mm (allDay면 무시)
  endTime: string;
  category: EventCategory;
  ownerId: string;
  description: string;
  /** true면 전 직원에게 공개 */
  shared: boolean;
}

/** 기간(YYYY-MM-DD, 양 끝 포함). 생략하면 전체 */
export interface EventListParams {
  from?: string;
  to?: string;
}

export interface CreateEventRequest {
  title: string;
  date: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  category: EventCategory;
  description?: string;
  shared: boolean;
}
