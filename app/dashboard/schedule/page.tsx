"use client";

import styled from "@emotion/styled";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { DayPanel } from "@/components/schedule/DayPanel";
import { EventDetailModal } from "@/components/schedule/EventDetailModal";
import { EventFormModal } from "@/components/schedule/EventFormModal";
import { MonthCalendar } from "@/components/schedule/MonthCalendar";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  Button,
  Card,
  CheckboxLabel,
  Dot,
  ErrorState,
  IconButton,
  LoadingState,
  PageHeader,
  Row,
} from "@/components/ui";
import { addMonths, getMonthMatrix, parseDateKey, toDateKey, todayKey } from "@/lib/date";
import { EVENT_CATEGORIES } from "@/lib/labels";
import { useEvents } from "@/queries/events";
import type { CalendarEvent, EventCategory } from "@/types";
import { mq } from "@/styles/theme";

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  ${mq.lg} {
    grid-template-columns: minmax(0, 1fr) 300px;
  }
`;

const CalendarHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;

  h2 {
    min-width: 120px;
    font-size: 18px;
    font-weight: 700;
    text-align: center;
  }
`;

const CATEGORY_KEYS = Object.keys(EVENT_CATEGORIES) as EventCategory[];

const sortEvents = (a: CalendarEvent, b: CalendarEvent) =>
  Number(b.allDay) - Number(a.allDay) || a.startTime.localeCompare(b.startTime);

export default function SchedulePage() {
  const [today] = useState(() => todayKey());
  const [month, setMonth] = useState(() => {
    const d = parseDateKey(today);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [filters, setFilters] = useState<Record<EventCategory, boolean>>({
    meeting: true,
    personal: true,
    company: true,
    trip: true,
  });
  const [formDate, setFormDate] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // 달력에 보이는 6주(앞뒤 달 포함) 범위만 불러온다. 서버가 내 일정 + 공유 일정만 준다.
  const matrix = getMonthMatrix(month.getFullYear(), month.getMonth());
  const range = { from: toDateKey(matrix[0][0]), to: toDateKey(matrix[matrix.length - 1][6]) };
  const { data: events, isPending, error, refetch } = useEvents(range);

  const visible = (events ?? []).filter((e) => filters[e.category]).sort(sortEvents);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of visible) {
    eventsByDate.set(event.date, [...(eventsByDate.get(event.date) ?? []), event]);
  }

  const detail = detailId ? events?.find((e) => e.id === detailId) : undefined;

  const select = (key: string) => {
    setSelected(key);
    const d = parseDateKey(key);
    if (d.getMonth() !== month.getMonth() || d.getFullYear() !== month.getFullYear()) {
      setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  };

  return (
    <>
      <PageHeader
        title="일정관리"
        description="개인 일정과 팀·전사 일정을 캘린더에서 관리합니다."
        actions={
          <Button onClick={() => setFormDate(selected)}>
            <Plus />
            일정 추가
          </Button>
        }
      />

      <Layout>
        <Card>
          <CalendarHeader>
            <Row $gap={4} $wrap={false}>
              <IconButton aria-label="이전 달" onClick={() => setMonth((m) => addMonths(m, -1))}>
                <ChevronLeft />
              </IconButton>
              <h2>
                {month.getFullYear()}년 {month.getMonth() + 1}월
              </h2>
              <IconButton aria-label="다음 달" onClick={() => setMonth((m) => addMonths(m, 1))}>
                <ChevronRight />
              </IconButton>
              <Button $size="sm" $variant="secondary" onClick={() => select(today)}>
                오늘
              </Button>
            </Row>
            <Row $gap={12}>
              {CATEGORY_KEYS.map((key) => (
                <CheckboxLabel key={key}>
                  <input
                    type="checkbox"
                    checked={filters[key]}
                    onChange={(e) => setFilters((f) => ({ ...f, [key]: e.target.checked }))}
                  />
                  <Dot $color={EVENT_CATEGORIES[key].color} />
                  {EVENT_CATEGORIES[key].label}
                </CheckboxLabel>
              ))}
            </Row>
          </CalendarHeader>
          {isPending ? (
            <LoadingState />
          ) : error && !events ? (
            <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
          ) : (
            <MonthCalendar
              month={month}
              selected={selected}
              today={today}
              eventsByDate={eventsByDate}
              onSelect={select}
              onEventClick={setDetailId}
            />
          )}
        </Card>

        <DayPanel
          date={selected}
          events={eventsByDate.get(selected) ?? []}
          onAdd={() => setFormDate(selected)}
          onEventClick={setDetailId}
        />
      </Layout>

      {formDate && <EventFormModal defaultDate={formDate} onClose={() => setFormDate(null)} />}
      {detail && <EventDetailModal event={detail} onClose={() => setDetailId(null)} />}
    </>
  );
}
