"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, FormGrid, Input, Modal, Select } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { minutesToTime, timeToMinutes, todayKey } from "@/lib/date";
import { setServerErrors } from "@/lib/form";
import { type ReservationFormValues, reservationSchema } from "@/lib/schemas/reservation";
import { useCreateReservation } from "@/queries/reservations";
import type { Room } from "@/types";
import { DAY_END, SLOT_ENDS, SLOT_STARTS } from "./constants";

const ErrorText = styled.p`
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

export interface ReservationDraft {
  roomId: string;
  date: string;
  startTime: string;
}

interface Props {
  draft: ReservationDraft;
  /** 표시 순서대로 정렬된 전체 회의실 */
  rooms: Room[];
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트되어 draft 값으로 초기화된다. */
export function ReservationFormModal({ draft, rooms, onClose }: Props) {
  const createReservation = useCreateReservation();
  const activeRooms = rooms.filter((room) => room.active);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      roomId: draft.roomId,
      date: draft.date,
      startTime: draft.startTime,
      endTime: minutesToTime(Math.min(timeToMinutes(draft.startTime) + 60, DAY_END)),
      title: "",
    },
  });

  // 겹침·사용 중지·지난 시간은 서버가 최종 확인한다. 필드 오류는 해당 칸에, 그 밖(겹침 등)은 아래에 보여 준다.
  const submit = handleSubmit((values) =>
    createReservation.mutate(values, {
      onSuccess: onClose,
      onError: (err) => {
        if (!setServerErrors(err, setError)) setError("root", { message: getErrorMessage(err) });
      },
    }),
  );

  return (
    <Modal
      open
      title="회의실 예약"
      onClose={onClose}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="reservation-form" disabled={createReservation.isPending}>
            예약
          </Button>
        </>
      }
    >
      <form id="reservation-form" onSubmit={submit} noValidate>
        <FormGrid>
          <Field label="회의실" required error={errors.roomId?.message}>
            {(id) => (
              <Select id={id} aria-invalid={!!errors.roomId} {...register("roomId")}>
                {activeRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity}인)
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="날짜" required error={errors.date?.message}>
            {(id) => (
              <Input id={id} type="date" min={todayKey()} aria-invalid={!!errors.date} {...register("date")} />
            )}
          </Field>
          <Field label="시작" required error={errors.startTime?.message}>
            {(id) => (
              <Select id={id} aria-invalid={!!errors.startTime} {...register("startTime")}>
                {SLOT_STARTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="종료" required error={errors.endTime?.message}>
            {(id) => (
              <Select id={id} aria-invalid={!!errors.endTime} {...register("endTime")}>
                {SLOT_ENDS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div data-span="full">
            <Field label="회의 제목" required error={errors.title?.message}>
              {(id) => (
                <Input
                  id={id}
                  placeholder="예: 주간 회의"
                  autoFocus
                  aria-invalid={!!errors.title}
                  {...register("title")}
                />
              )}
            </Field>
          </div>
        </FormGrid>
        {errors.root && <ErrorText role="alert">{errors.root.message}</ErrorText>}
      </form>
    </Modal>
  );
}
