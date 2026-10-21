"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { Button, Field, FormGrid, Input, Modal, Select } from "@/components/ui";
import { minutesToTime, nowTime, timeToMinutes, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
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
  const [roomId, setRoomId] = useState(draft.roomId);
  const [date, setDate] = useState(draft.date);
  const [startTime, setStartTime] = useState(draft.startTime);
  const [endTime, setEndTime] = useState(() =>
    minutesToTime(Math.min(timeToMinutes(draft.startTime) + 60, DAY_END)),
  );
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("회의 제목을 입력하세요.");
    if (!activeRooms.some((room) => room.id === roomId)) {
      return setError("사용 중지된 회의실은 예약할 수 없습니다. 다른 회의실을 선택하세요.");
    }
    if (!date) return setError("날짜를 선택하세요.");
    if (endTime <= startTime) return setError("종료 시간은 시작 시간보다 늦어야 합니다.");
    const today = todayKey();
    if (date < today || (date === today && startTime < nowTime())) {
      return setError("지난 시간은 예약할 수 없습니다.");
    }
    const candidate = { roomId, date, startTime, endTime };
    if (isOverlapping(data.reservations, candidate)) {
      return setError("선택한 시간에 이미 예약이 있습니다.");
    }
    update((prev) => ({
      ...prev,
      reservations: [
        ...prev.reservations,
        { id: createId("r"), ...candidate, title: title.trim(), memberId: user.id },
      ],
    }));
    onClose();
  };

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
      <form id="reservation-form" onSubmit={submit}>
        <FormGrid>
          <Field label="회의실" required>
            {(id) => (
              <Select id={id} value={roomId} onChange={(e) => setRoomId(e.target.value)}>
                {activeRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity}인)
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="날짜" required>
            {(id) => (
              <Input id={id} type="date" value={date} min={todayKey()} onChange={(e) => setDate(e.target.value)} />
            )}
          </Field>
          <Field label="시작" required>
            {(id) => (
              <Select id={id} value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                {SLOT_STARTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="종료" required>
            {(id) => (
              <Select id={id} value={endTime} onChange={(e) => setEndTime(e.target.value)}>
                {SLOT_ENDS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div data-span="full">
            <Field label="회의 제목" required>
              {(id) => (
                <Input
                  id={id}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 주간 회의"
                  autoFocus
                />
              )}
            </Field>
          </div>
        </FormGrid>
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </form>
    </Modal>
  );
}
