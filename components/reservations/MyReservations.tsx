"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  ConfirmModal,
  EmptyState,
  MutedCell,
  Table,
  TableWrap,
  TitleCell,
} from "@/components/ui";
import { formatMonthDay, todayKey } from "@/lib/date";
import { getRoomName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";

export function MyReservations() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [cancelId, setCancelId] = useState<string | null>(null);
  const today = todayKey();

  const mine = data.reservations
    .filter((r) => r.memberId === user.id && r.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const cancel = (id: string) => {
    update((prev) => ({ ...prev, reservations: prev.reservations.filter((r) => r.id !== id) }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>내 예약 ({mine.length})</CardTitle>
      </CardHeader>
      {mine.length === 0 ? (
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
                  <MutedCell>{getRoomName(data, r)}</MutedCell>
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
      <ConfirmModal
        open={cancelId !== null}
        title="예약 취소"
        message="이 회의실 예약을 취소할까요?"
        confirmLabel="예약 취소"
        danger
        onConfirm={() => cancelId && cancel(cancelId)}
        onClose={() => setCancelId(null)}
      />
    </Card>
  );
}
