"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { createId } from "@/lib/id";
import { EVENT_CATEGORIES } from "@/lib/labels";
import { type EventFormValues, eventSchema } from "@/lib/schemas/schedule";
import { useCurrentUser, useData } from "@/lib/store";
import type { EventCategory } from "@/lib/types";

interface Props {
  defaultDate: string;
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트되어 defaultDate로 초기화된다. */
export function EventFormModal({ defaultDate, onClose }: Props) {
  const { update } = useData();
  const user = useCurrentUser();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      date: defaultDate,
      allDay: false,
      startTime: "10:00",
      endTime: "11:00",
      category: "meeting",
      description: "",
      shared: true,
    },
  });
  const [allDay, category] = useWatch({ control, name: ["allDay", "category"] });

  // 전사 일정은 매니저만 등록할 수 있고 항상 공개된다.
  const categories = (Object.keys(EVENT_CATEGORIES) as EventCategory[]).filter(
    (key) => key !== "company" || user.isManager,
  );
  const isCompany = category === "company";

  const submit = handleSubmit((values) => {
    update((prev) => ({
      ...prev,
      events: [
        ...prev.events,
        {
          id: createId("e"),
          title: values.title,
          date: values.date,
          allDay: values.allDay,
          startTime: values.allDay ? "09:00" : values.startTime,
          endTime: values.allDay ? "18:00" : values.endTime,
          category: values.category,
          ownerId: user.id,
          description: values.description,
          shared: values.category === "company" || values.shared,
        },
      ],
    }));
    onClose();
  });

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
      <form id="event-form" onSubmit={submit} noValidate>
        <FormGrid>
          <div data-span="full">
            <Field label="제목" required error={errors.title?.message}>
              {(id) => (
                <Input
                  id={id}
                  placeholder="일정 제목"
                  autoFocus
                  aria-invalid={!!errors.title}
                  {...register("title")}
                />
              )}
            </Field>
          </div>
          <Field label="날짜" required error={errors.date?.message}>
            {(id) => <Input id={id} type="date" aria-invalid={!!errors.date} {...register("date")} />}
          </Field>
          <Field label="분류" required>
            {(id) => (
              <Select id={id} {...register("category")}>
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
              <input type="checkbox" {...register("allDay")} />
              종일 일정
            </CheckboxLabel>
          </div>
          {!allDay && (
            <>
              <Field label="시작 시간" required>
                {(id) => <Input id={id} type="time" step={600} {...register("startTime")} />}
              </Field>
              <Field label="종료 시간" required error={errors.endTime?.message}>
                {(id) => (
                  <Input id={id} type="time" step={600} aria-invalid={!!errors.endTime} {...register("endTime")} />
                )}
              </Field>
            </>
          )}
          <div data-span="full">
            <Field label="설명">
              {(id) => (
                <Textarea
                  id={id}
                  placeholder="장소, 참석자 등"
                  style={{ minHeight: 88 }}
                  {...register("description")}
                />
              )}
            </Field>
          </div>
          <div data-span="full">
            <Row>
              <CheckboxLabel>
                {/* 전사 일정은 항상 공개: disabled로 렌더링하되 값은 폼 상태로 유지한다. */}
                <Controller
                  control={control}
                  name="shared"
                  render={({ field }) => (
                    <input
                      ref={field.ref}
                      type="checkbox"
                      name={field.name}
                      checked={isCompany || field.value}
                      disabled={isCompany}
                      onChange={(e) => field.onChange(e.target.checked)}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                전 직원에게 공개
              </CheckboxLabel>
            </Row>
          </div>
        </FormGrid>
      </form>
    </Modal>
  );
}
