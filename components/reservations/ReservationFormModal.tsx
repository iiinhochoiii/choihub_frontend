"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, FormGrid, Input, Modal, Select } from "@/components/ui";
import { minutesToTime, timeToMinutes, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { type ReservationFormValues, reservationSchema } from "@/lib/schemas/reservation";
import { useCurrentUser, useData } from "@/lib/store";
import { DAY_END, isOverlapping, SLOT_ENDS, SLOT_STARTS } from "./constants";

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
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트되어 draft 값으로 초기화된다. */
export function ReservationFormModal({ draft, onClose }: Props) {
  const { data, update } = useData();
  const user = useCurrentUser();
  const activeRooms = data.rooms.filter((room) => room.active);
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

  const submit = handleSubmit(({ title, ...candidate }) => {
    if (!activeRooms.some((room) => room.id === candidate.roomId)) {
      return setError("roomId", {
        message: "사용 중지된 회의실은 예약할 수 없습니다. 다른 회의실을 선택하세요.",
      });
    }
    if (isOverlapping(data.reservations, candidate)) {
      return setError("root", { message: "선택한 시간에 이미 예약이 있습니다." });
    }
    update((prev) => ({
      ...prev,
      reservations: [...prev.reservations, { id: createId("r"), ...candidate, title, memberId: user.id }],
    }));
    onClose();
  });

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
          <Button type="submit" form="reservation-form">
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
