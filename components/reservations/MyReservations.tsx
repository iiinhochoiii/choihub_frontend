"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  LoadingState,
  Modal,
  MutedCell,
  Table,
  TableWrap,
  TitleCell,
} from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { formatMonthDay } from "@/lib/date";
import { getRoomName } from "@/lib/selectors";
import { useCancelReservation, useMyReservations } from "@/queries/reservations";
import type { Room } from "@/types";

const ErrorText = styled.p`
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

export function MyReservations({ rooms }: { rooms: Room[] }) {
  // 서버가 오늘 이후 내 예약을 날짜·시간순으로 돌려준다.
  const { data: mine, isPending, error, refetch } = useMyReservations();
  const cancelReservation = useCancelReservation();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const closeCancel = () => {
    setCancelId(null);
    cancelReservation.reset();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>내 예약{mine && ` (${mine.length})`}</CardTitle>
      </CardHeader>
      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : mine.length === 0 ? (
        <EmptyState title="예정된 예약이 없습니다" />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>시간</th>
                <th>회의실</th>
                <th>제목</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mine.map((r) => (
                <tr key={r.id}>
                  <td>{formatMonthDay(r.date)}</td>
                  <td>
                    {r.startTime} ~ {r.endTime}
                  </td>
                  <MutedCell>{getRoomName(rooms, r)}</MutedCell>
                  <TitleCell $maxWidth={260}>{r.title}</TitleCell>
                  <td style={{ textAlign: "right" }}>
                    <Button $size="sm" $variant="ghost" onClick={() => setCancelId(r.id)}>
                      취소
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
      <Modal
        open={cancelId !== null}
        title="예약 취소"
        width={400}
        onClose={closeCancel}
        footer={
          <>
            <Button $variant="secondary" onClick={closeCancel}>
              취소
            </Button>
            <Button
              $variant="danger"
              disabled={cancelReservation.isPending}
              onClick={() => cancelId && cancelReservation.mutate(cancelId, { onSuccess: closeCancel })}
            >
              예약 취소
            </Button>
          </>
        }
      >
        <p>이 회의실 예약을 취소할까요?</p>
        {cancelReservation.error && <ErrorText role="alert">{getErrorMessage(cancelReservation.error)}</ErrorText>}
      </Modal>
    </Card>
  );
}
