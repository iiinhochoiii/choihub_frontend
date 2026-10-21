"use client";

import styled from "@emotion/styled";
import { Plus } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, EmptyState, transientOptions } from "@/components/ui";
import { formatMonthDay } from "@/lib/date";
import { EVENT_CATEGORIES } from "@/lib/labels";
import { getMemberName } from "@/lib/selectors";
import { useData } from "@/lib/store";
import type { CalendarEvent } from "@/lib/types";

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled("button", transientOptions)<{ $color: string }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border-left: 3px solid ${({ $color }) => $color};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  strong {
    font-weight: 600;
  }

  small {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

interface Props {
  date: string;
  events: CalendarEvent[];
  onAdd: () => void;
  onEventClick: (id: string) => void;
}

export function DayPanel({ date, events, onAdd, onEventClick }: Props) {
  const { data } = useData();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{formatMonthDay(date)}</CardTitle>
        <Button $size="sm" $variant="secondary" onClick={onAdd}>
          <Plus />
          추가
        </Button>
      </CardHeader>
      {events.length === 0 ? (
        <EmptyState title="일정이 없습니다" description="새 일정을 추가해 보세요." />
      ) : (
        <List>
          {events.map((event) => {
            const category = EVENT_CATEGORIES[event.category];
            return (
              <li key={event.id}>
                <Item $color={category.color} onClick={() => onEventClick(event.id)}>
                  <strong>{event.title}</strong>
                  <small>
                    {event.allDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
                    <span>· {getMemberName(data, event.ownerId)}</span>
                    <Badge $tone={event.shared ? "primary" : "neutral"}>
                      {event.shared ? category.label : "비공개"}
                    </Badge>
                  </small>
                </Item>
              </li>
            );
          })}
        </List>
      )}
    </Card>
  );
}
