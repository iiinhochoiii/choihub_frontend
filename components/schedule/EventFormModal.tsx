"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import {
  Button,
  CheckboxLabel,
  Field,
  FormGrid,
  Input,
  Modal,
  Row,
  Select,
  Textarea,
} from "@/components/ui";
import { timeToMinutes } from "@/lib/date";
import { createId } from "@/lib/id";
import { EVENT_CATEGORIES } from "@/lib/labels";
import { useCurrentUser, useData } from "@/lib/store";
import type { EventCategory } from "@/lib/types";

const ErrorText = styled.p`
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

interface Props {
  defaultDate: string;
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트되어 defaultDate로 초기화된다. */
export function EventFormModal({ defaultDate, onClose }: Props) {
  const { update } = useData();
  const user = useCurrentUser();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [category, setCategory] = useState<EventCategory>("meeting");
  const [description, setDescription] = useState("");
  const [shared, setShared] = useState(true);
  const [error, setError] = useState("");

  // 전사 일정은 매니저만 등록할 수 있고 항상 공개된다.
  const categories = (Object.keys(EVENT_CATEGORIES) as EventCategory[]).filter(
    (key) => key !== "company" || user.isManager,
  );
  const isCompany = category === "company";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("제목을 입력하세요.");
    if (!date) return setError("날짜를 선택하세요.");
    if (!allDay && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return setError("종료 시간은 시작 시간보다 늦어야 합니다.");
    }
    update((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: createId("e"),
          title: title.trim(),
          date,
          allDay,
          startTime: allDay ? "09:00" : startTime,
          endTime: allDay ? "18:00" : endTime,
          category,
          ownerId: user.id,
          description: description.trim(),
          shared: isCompany || shared,
        },
      ],
    }));
    onClose();
  };

  return (
    <Modal
      open
      title="일정 추가"
      onClose={onClose}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="event-form">
            저장
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit}>
        <FormGrid>
          <div data-span="full">
            <Field label="제목" required>
              {(id) => (
                <Input
                  id={id}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="일정 제목"
                  autoFocus
                />
              )}
            </Field>
          </div>
          <Field label="날짜" required>
            {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="분류" required>
            {(id) => (
              <Select id={id} value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
                {categories.map((key) => (
                  <option key={key} value={key}>
                    {EVENT_CATEGORIES[key].label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <div data-span="full">
            <CheckboxLabel>
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              종일 일정
            </CheckboxLabel>
          </div>
          {!allDay && (
            <>
              <Field label="시작 시간" required>
                {(id) => (
                  <Input id={id} type="time" step={600} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                )}
              </Field>
              <Field label="종료 시간" required>
                {(id) => (
                  <Input id={id} type="time" step={600} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                )}
              </Field>
            </>
          )}
          <div data-span="full">
            <Field label="설명">
              {(id) => (
                <Textarea
                  id={id}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="장소, 참석자 등"
                  style={{ minHeight: 88 }}
                />
              )}
            </Field>
          </div>
          <div data-span="full">
            <Row>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={isCompany || shared}
                  disabled={isCompany}
                  onChange={(e) => setShared(e.target.checked)}
                />
                전 직원에게 공개
              </CheckboxLabel>
            </Row>
          </div>
        </FormGrid>
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </form>
    </Modal>
  );
}
