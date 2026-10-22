import { z } from "zod";
import { timeToMinutes } from "@/lib/date";
import { EVENT_CATEGORIES } from "@/lib/labels";
import type { EventCategory } from "@/lib/types";

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, "제목을 입력하세요."),
    date: z.string().min(1, "날짜를 선택하세요."),
    allDay: z.boolean(),
    startTime: z.string(),
    endTime: z.string(),
    category: z.enum(Object.keys(EVENT_CATEGORIES) as [EventCategory, ...EventCategory[]]),
    description: z.string().trim(),
    shared: z.boolean(),
  })
  .refine((values) => values.allDay || timeToMinutes(values.endTime) > timeToMinutes(values.startTime), {
    path: ["endTime"],
    message: "종료 시간은 시작 시간보다 늦어야 합니다.",
  });

export type EventFormValues = z.infer<typeof eventSchema>;
