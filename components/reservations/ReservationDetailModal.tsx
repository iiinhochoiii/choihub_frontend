"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { Button, Modal, Muted, Person } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { formatMonthDay } from "@/lib/date";
import { getRoomName } from "@/lib/selectors";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { useCancelReservation } from "@/queries/reservations";
import type { Reservation, Room } from "@/types";
import { UNKNOWN_MEMBER_NAME } from "@/lib/selectors";

const ErrorText = styled.p`
  margin-top: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

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
  rooms: Room[];
  onClose: () => void;
}

export function ReservationDetailModal({ reservation, rooms, onClose }: Props) {
  const user = useCurrentUser();
  const { getMember, getMemberSummary } = useDirectory();
  const cancelReservation = useCancelReservation();
  const [confirming, setConfirming] = useState(false);
  const room = rooms.find((r) => r.id === reservation.roomId);
  const owner = getMember(reservation.memberId);
  // 버튼 표시용. 권한은 서버가 다시 확인한다.
  const canCancel = reservation.memberId === user.id || user.isManager;

  const cancel = () => cancelReservation.mutate(reservation.id, { onSuccess: onClose });

  const footer = confirming ? (
    <>
      <Muted style={{ marginRight: "auto", alignSelf: "center" }}>예약을 취소할까요?</Muted>
      <Button $variant="secondary" onClick={() => setConfirming(false)}>
        아니요
      </Button>
      <Button $variant="danger" disabled={cancelReservation.isPending} onClick={cancel}>
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
          {room ? `${room.name} · ${room.location} (${room.capacity}인)` : getRoomName(rooms, reservation)}
        </dd>
        <dt>일시</dt>
        <dd>
          {formatMonthDay(reservation.date)} {reservation.startTime} ~ {reservation.endTime}
        </dd>
        <dt>예약자</dt>
        <dd>
          {owner ? (
            <Person name={owner.name} color={owner.color} caption={getMemberSummary(owner.id)} />
          ) : (
            UNKNOWN_MEMBER_NAME
          )}
        </dd>
      </Info>
      {cancelReservation.error && <ErrorText role="alert">{getErrorMessage(cancelReservation.error)}</ErrorText>}
    </Modal>
  );
}
