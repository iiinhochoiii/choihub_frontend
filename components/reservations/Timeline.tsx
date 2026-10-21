"use client";

import styled from "@emotion/styled";
import { MapPin, Users } from "lucide-react";
import { transientOptions } from "@/components/ui";
import { nowTime, todayKey } from "@/lib/date";
import { getMemberName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { Reservation } from "@/lib/types";
import { DAY_END, DAY_START, SLOT_MINUTES, SLOT_STARTS, SLOT_WIDTH, slotIndex } from "./constants";

const ROOM_COL = 180;

const Scroll = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${ROOM_COL}px repeat(${SLOT_STARTS.length}, ${SLOT_WIDTH}px);
  width: max-content;
  min-width: 100%;
`;

const Sticky = styled.div`
  position: sticky;
  left: 0;
  z-index: 2;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderCorner = styled(Sticky)`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`;

const HourLabel = styled.div`
  grid-column: span 2;
  padding: 8px 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
`;

const RoomCell = styled(Sticky)`
  padding: 10px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  strong {
    display: block;
    font-weight: 600;
  }

  small {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const InactiveTag = styled.span`
  display: inline-block;
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.warning};
`;

const Lane = styled("div", transientOptions)<{ $inactive?: boolean }>`
  grid-column: 2 / -1;
  background: ${({ theme, $inactive }) =>
    $inactive
      ? `repeating-linear-gradient(-45deg, transparent 0 8px, ${theme.colors.surfaceHover} 8px 16px)`
      : "transparent"};
  display: grid;
  grid-template-columns: repeat(${SLOT_STARTS.length}, ${SLOT_WIDTH}px);
  grid-template-rows: minmax(64px, auto);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Slot = styled("button", transientOptions)<{ $col: number; $hour: boolean }>`
  grid-row: 1;
  grid-column: ${({ $col }) => $col};
  border-left: 1px ${({ $hour }) => ($hour ? "solid" : "dashed")} ${({ theme }) => theme.colors.border};
  transition: background-color 0.1s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  &:disabled {
    cursor: default;
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  &[data-inactive="true"] {
    cursor: not-allowed;
    background: transparent;
  }
`;

const Block = styled("button", transientOptions)<{ $start: number; $end: number; $mine: boolean }>`
  grid-row: 1;
  grid-column: ${({ $start, $end }) => `${$start} / ${$end}`};
  z-index: 1;
  margin: 6px 2px;
  padding: 6px 8px;
  min-width: 0;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.radii.sm};
  text-align: left;
  font-size: 12px;
  line-height: 1.35;
  background: ${({ theme, $mine }) => ($mine ? theme.colors.primary : theme.colors.primarySoft)};
  color: ${({ theme, $mine }) => ($mine ? theme.colors.onPrimary : theme.colors.primary)};
  border: 1px solid ${({ theme }) => theme.colors.primary};

  strong,
  span {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    font-weight: 600;
  }
`;

interface Props {
  date: string;
  onSlotClick: (roomId: string, startTime: string) => void;
  onReservationClick: (reservation: Reservation) => void;
}

export function Timeline({ date, onSlotClick, onReservationClick }: Props) {
  const { data } = useData();
  const user = useCurrentUser();
  const today = todayKey();
  const current = nowTime();

  const isPast = (start: string) => date < today || (date === today && start < current);

  return (
    <Scroll>
      <Grid>
        <HeaderCorner />
        {SLOT_STARTS.filter((_, i) => i % 2 === 0).map((time) => (
          <HourLabel key={time}>{time}</HourLabel>
        ))}

        {data.rooms.map((room) => {
          const reservations = data.reservations.filter((r) => r.roomId === room.id && r.date === date);
          return (
            <div key={room.id} style={{ display: "contents" }}>
              <RoomCell>
                <strong>{room.name}</strong>
                <small>
                  <Users />
                  {room.capacity}인 · <MapPin />
                  {room.location}
                </small>
                <small>{room.equipment.join(", ")}</small>
                {!room.active && (
                  <InactiveTag title={room.inactiveReason}>
                    사용 중지{room.inactiveReason && ` · ${room.inactiveReason}`}
                  </InactiveTag>
                )}
              </RoomCell>
              <Lane $inactive={!room.active}>
                {SLOT_STARTS.map((time, i) => (
                  <Slot
                    key={time}
                    $col={i + 1}
                    $hour={i % 2 === 0}
                    disabled={!room.active || isPast(time)}
                    data-inactive={!room.active}
                    aria-label={room.active ? `${room.name} ${time} 예약` : `${room.name} 사용 중지`}
                    onClick={() => onSlotClick(room.id, time)}
                  />
                ))}
                {reservations.map((r) => {
                  const start = Math.max(0, slotIndex(r.startTime));
                  const end = Math.min(
                    (DAY_END - DAY_START) / SLOT_MINUTES,
                    Math.ceil(slotIndex(r.endTime)),
                  );
                  if (end <= start) return null;
                  return (
                    <Block
                      key={r.id}
                      $start={Math.floor(start) + 1}
                      $end={end + 1}
                      $mine={r.memberId === user.id}
                      title={`${r.startTime}~${r.endTime} ${r.title}`}
                      onClick={() => onReservationClick(r)}
                    >
                      <strong>{r.title}</strong>
                      <span>
                        {r.startTime}~{r.endTime} · {getMemberName(data, r.memberId)}
                      </span>
                    </Block>
                  );
                })}
              </Lane>
            </div>
          );
        })}
      </Grid>
    </Scroll>
  );
}
