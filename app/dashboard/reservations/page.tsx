"use client";

import styled from "@emotion/styled";
import { ChevronLeft, ChevronRight, Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { MyReservations } from "@/components/reservations/MyReservations";
import { ReservationDetailModal } from "@/components/reservations/ReservationDetailModal";
import { ReservationFormModal, type ReservationDraft } from "@/components/reservations/ReservationFormModal";
import { Timeline } from "@/components/reservations/Timeline";
import {
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingState,
  Muted,
  PageHeader,
  Row,
  Stack,
} from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { addDays, formatMonthDay, parseDateKey, toDateKey, todayKey } from "@/lib/date";
import { useCurrentUser } from "@/queries/auth";
import { useReservationsByDate, useRooms } from "@/queries/reservations";
import type { Reservation } from "@/types";

const DateInput = styled(Input)`
  width: 160px;
`;

const Legend = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};

  i {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid ${({ theme }) => theme.colors.primary};
  }

  i[data-mine="true"] {
    background: ${({ theme }) => theme.colors.primary};
  }

  i[data-mine="false"] {
    background: ${({ theme }) => theme.colors.primarySoft};
  }
`;

export default function ReservationsPage() {
  const user = useCurrentUser();
  const [date, setDate] = useState(() => todayKey());
  const roomsQuery = useRooms();
  // 시간표에는 선택한 날짜의 회사 전체 예약을 받아 그린다.
  const reservationsQuery = useReservationsByDate(date);
  const rooms = roomsQuery.data ?? [];
  const firstActiveRoom = rooms.find((room) => room.active);
  const [draft, setDraft] = useState<ReservationDraft | null>(null);
  const [detail, setDetail] = useState<Reservation | null>(null);

  const shift = (days: number) => setDate((d) => toDateKey(addDays(parseDateKey(d), days)));
  const count = reservationsQuery.isPlaceholderData ? undefined : reservationsQuery.data?.length;
  const loadError = roomsQuery.error ?? reservationsQuery.error;
  const retry = () => {
    if (roomsQuery.error) void roomsQuery.refetch();
    if (reservationsQuery.error) void reservationsQuery.refetch();
  };

  return (
    <>
      <PageHeader
        title="회의실 예약"
        description="회의실 사용 현황을 확인하고 빈 시간에 예약합니다."
        actions={
          <>
            {user.isManager && (
              <ButtonLink href="/dashboard/reservations/rooms" $variant="secondary">
                <Settings2 />
                회의실 관리
              </ButtonLink>
            )}
            <Button
              disabled={!firstActiveRoom}
              onClick={() => firstActiveRoom && setDraft({ roomId: firstActiveRoom.id, date, startTime: "10:00" })}
            >
              <Plus />
              예약하기
            </Button>
          </>
        }
      />

      <Stack $gap={20}>
        <Row $justify="space-between" $gap={12}>
          <Row $gap={4}>
            <IconButton aria-label="이전 날" onClick={() => shift(-1)}>
              <ChevronLeft />
            </IconButton>
            <DateInput
              type="date"
              value={date}
              aria-label="날짜 선택"
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
            <IconButton aria-label="다음 날" onClick={() => shift(1)}>
              <ChevronRight />
            </IconButton>
            <Button $size="sm" $variant="secondary" onClick={() => setDate(todayKey())}>
              오늘
            </Button>
          </Row>
          <Row $gap={12}>
            <Muted>
              {formatMonthDay(date)}
              {count !== undefined && ` · 예약 ${count}건`}
            </Muted>
            <Legend>
              <i data-mine="true" />내 예약
            </Legend>
            <Legend>
              <i data-mine="false" />
              다른 예약
            </Legend>
          </Row>
        </Row>

        {roomsQuery.isPending || reservationsQuery.isPending ? (
          <LoadingState />
        ) : loadError ? (
          <ErrorState message={getErrorMessage(loadError)} onRetry={retry} />
        ) : (
          <>
            {rooms.length === 0 && (
              <EmptyState
                title="등록된 회의실이 없습니다"
                description={
                  user.isManager ? "회의실 관리에서 회의실을 추가하세요." : "매니저에게 회의실 등록을 요청하세요."
                }
              />
            )}

            <Timeline
              date={date}
              rooms={rooms}
              reservations={reservationsQuery.data ?? []}
              onSlotClick={(roomId, startTime) => setDraft({ roomId, date, startTime })}
              onReservationClick={setDetail}
            />
          </>
        )}
        <Muted>빈 칸을 누르면 해당 시간으로 예약할 수 있습니다. 표는 좌우로 스크롤됩니다.</Muted>

        <MyReservations rooms={rooms} />
      </Stack>

      {draft && <ReservationFormModal draft={draft} rooms={rooms} onClose={() => setDraft(null)} />}
      {detail && <ReservationDetailModal reservation={detail} rooms={rooms} onClose={() => setDetail(null)} />}
    </>
  );
}
