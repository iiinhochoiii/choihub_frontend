"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { Button, Modal, Muted, Person } from "@/components/ui";
import { formatMonthDay } from "@/lib/date";
import { getMember, getMemberSummary, getRoomName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { Reservation } from "@/lib/types";

const Info = styled.dl`
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px 8px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    min-width: 0;
  }
`;

interface Props {
  reservation: Reservation;
  onClose: () => void;
}

export function ReservationDetailModal({ reservation, onClose }: Props) {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [confirming, setConfirming] = useState(false);
  const room = data.rooms.find((r) => r.id === reservation.roomId);
  const owner = getMember(data, reservation.memberId);
  const canCancel = reservation.memberId === user.id || user.isManager;

  const cancel = () => {
    update((prev) => ({
      ...prev,
      reservations: prev.reservations.filter((r) => r.id !== reservation.id),
    }));
    onClose();
  };

  const footer = confirming ? (
    <>
      <Muted style={{ marginRight: "auto", alignSelf: "center" }}>예약을 취소할까요?</Muted>
      <Button $variant="secondary" onClick={() => setConfirming(false)}>
        아니요
      </Button>
      <Button $variant="danger" onClick={cancel}>
        예약 취소
      </Button>
    </>
  ) : (
    <>
      {canCancel && (
        <Button $variant="ghost" style={{ marginRight: "auto" }} onClick={() => setConfirming(true)}>
          예약 취소
        </Button>
      )}
      <Button $variant="secondary" onClick={onClose}>
        닫기
      </Button>
    </>
  );

  return (
    <Modal open title={reservation.title} onClose={onClose} width={440} footer={footer}>
      <Info>
        <dt>회의실</dt>
        <dd>
          {room ? `${room.name} · ${room.location} (${room.capacity}인)` : getRoomName(data, reservation)}
        </dd>
        <dt>일시</dt>
        <dd>
          {formatMonthDay(reservation.date)} {reservation.startTime} ~ {reservation.endTime}
        </dd>
        <dt>예약자</dt>
        <dd>
          {owner ? (
            <Person name={owner.name} color={owner.color} caption={getMemberSummary(data, owner.id)} />
          ) : (
            "알 수 없음"
          )}
        </dd>
      </Info>
    </Modal>
  );
}
