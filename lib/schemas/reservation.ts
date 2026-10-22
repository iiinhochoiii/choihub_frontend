import { z } from "zod";
import { nowTime, todayKey } from "@/lib/date";

export const reservationSchema = z
  .object({
    roomId: z.string(),
    date: z.string().min(1, "날짜를 선택하세요."),
    startTime: z.string(),
    endTime: z.string(),
    title: z.string().trim().min(1, "회의 제목을 입력하세요."),
  })
  .superRefine((values, ctx) => {
    if (values.endTime <= values.startTime) {
      ctx.addIssue({ code: "custom", path: ["endTime"], message: "종료 시간은 시작 시간보다 늦어야 합니다." });
      return;
    }
    // 제출 시점의 현재 시각 기준으로 검사한다.
    const today = todayKey();
    if (values.date < today || (values.date === today && values.startTime < nowTime())) {
      ctx.addIssue({
        code: "custom",
        path: [values.date < today ? "date" : "startTime"],
        message: "지난 시간은 예약할 수 없습니다.",
      });
    }
  });

export type ReservationFormValues = z.infer<typeof reservationSchema>;

const CAPACITY_MESSAGE = "수용 인원은 1~500 사이의 정수로 입력하세요.";

export const roomSchema = z.object({
  name: z.string().trim().min(1, "회의실 이름을 입력하세요."),
  capacity: z.coerce
    .number({ error: CAPACITY_MESSAGE })
    .int(CAPACITY_MESSAGE)
    .min(1, CAPACITY_MESSAGE)
    .max(500, CAPACITY_MESSAGE),
  location: z.string().trim().min(1, "위치를 입력하세요."),
  /** 쉼표로 구분한 문자열 → 장비 목록 */
  equipment: z.string().transform((value) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ),
});

export type RoomFormInput = z.input<typeof roomSchema>;
export type RoomFormValues = z.output<typeof roomSchema>;
