"use client";

import styled from "@emotion/styled";
import { transientOptions } from "@/components/ui";
import { getMonthMatrix, toDateKey, WEEKDAY_LABELS } from "@/lib/date";
import { EVENT_CATEGORIES } from "@/lib/labels";
import type { CalendarEvent } from "@/types";
import { mq } from "@/styles/theme";

const MAX_CHIPS = 3;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
`;

const WeekdayCell = styled("div", transientOptions)<{ $tone?: "sun" | "sat" }>`
  padding: 8px 0;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  color: ${({ theme, $tone }) =>
    $tone === "sun" ? theme.colors.danger : $tone === "sat" ? theme.colors.primary : theme.colors.textMuted};
`;

const DayCell = styled("div", transientOptions)<{ $outside: boolean; $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  min-height: 64px;
  padding: 4px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : theme.colors.surface)};
  opacity: ${({ $outside }) => ($outside ? 0.45 : 1)};
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: ${({ theme, $selected }) => ($selected ? theme.colors.primarySoft : theme.colors.surfaceHover)};
  }

  ${mq.md} {
    min-height: 108px;
    padding: 6px;
  }
`;

const DateButton = styled("button", transientOptions)<{ $today: boolean; $tone?: "sun" | "sat" }>`
  align-self: flex-start;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: ${({ theme, $today }) => ($today ? theme.colors.primary : "transparent")};
  color: ${({ theme, $today, $tone }) =>
    $today
      ? theme.colors.onPrimary
      : $tone === "sun"
        ? theme.colors.danger
        : $tone === "sat"
          ? theme.colors.primary
          : theme.colors.text};
`;

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  min-width: 0;

  ${mq.sm} {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: 2px;
  }
`;

const Chip = styled("button", transientOptions)<{ $color: string }>`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  border-radius: 4px;
  font-size: 11px;
  text-align: left;
  color: ${({ theme }) => theme.colors.text};

  &::before {
    content: "";
    flex-shrink: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }

  span {
    display: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  ${mq.sm} {
    width: 100%;
    padding: 1px 4px;
    background: ${({ $color }) => `${$color}1f`};

    span {
      display: block;
    }

    &:hover {
      background: ${({ $color }) => `${$color}33`};
    }
  }
`;

const More = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding-left: 2px;
`;

interface Props {
  month: Date;
  selected: string;
  today: string;
  eventsByDate: Map<string, CalendarEvent[]>;
  onSelect: (dateKey: string) => void;
  onEventClick: (id: string) => void;
}

const toneOf = (day: number) => (day === 0 ? "sun" : day === 6 ? "sat" : undefined);

export function MonthCalendar({ month, selected, today, eventsByDate, onSelect, onEventClick }: Props) {
  const weeks = getMonthMatrix(month.getFullYear(), month.getMonth());

  return (
    <Grid>
      {WEEKDAY_LABELS.map((label, i) => (
        <WeekdayCell key={label} $tone={toneOf(i)}>
          {label}
        </WeekdayCell>
      ))}
      {weeks.flat().map((date) => {
        const key = toDateKey(date);
        const events = eventsByDate.get(key) ?? [];
        const outside = date.getMonth() !== month.getMonth();
        return (
          <DayCell key={key} $outside={outside} $selected={key === selected} onClick={() => onSelect(key)}>
            <DateButton
              $today={key === today}
              $tone={toneOf(date.getDay())}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일, 일정 ${events.length}건`}
              aria-pressed={key === selected}
            >
              {date.getDate()}
            </DateButton>
            <Chips>
              {events.slice(0, MAX_CHIPS).map((event) => (
                <Chip
                  key={event.id}
                  $color={EVENT_CATEGORIES[event.category].color}
                  title={event.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event.id);
                  }}
                >
                  <span>
                    {!event.allDay && `${event.startTime} `}
                    {event.title}
                  </span>
                </Chip>
              ))}
              {events.length > MAX_CHIPS && <More>+{events.length - MAX_CHIPS}</More>}
            </Chips>
          </DayCell>
        );
      })}
    </Grid>
  );
}
