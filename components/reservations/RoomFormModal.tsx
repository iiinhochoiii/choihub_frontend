"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, FormGrid, Input, Modal } from "@/components/ui";
import { createId } from "@/lib/id";
import { type RoomFormInput, type RoomFormValues, roomSchema } from "@/lib/schemas/reservation";
import { useData } from "@/lib/store";
import type { Room } from "@/lib/types";

interface Props {
  /** 없으면 신규 추가 */
  room?: Room;
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트되어 room 값으로 초기화된다. */
export function RoomFormModal({ room, onClose }: Props) {
  const { data, update } = useData();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RoomFormInput, unknown, RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: room?.name ?? "",
      capacity: room ? String(room.capacity) : "",
      location: room?.location ?? "",
      equipment: room?.equipment.join(", ") ?? "",
    },
  });

  const submit = handleSubmit((values) => {
    if (data.rooms.some((r) => r.id !== room?.id && r.name === values.name)) {
      return setError("name", { message: "같은 이름의 회의실이 이미 있습니다." });
    }
    update((prev) => ({
      ...prev,
      rooms: room
        ? prev.rooms.map((r) => (r.id === room.id ? { ...r, ...values } : r))
        : [...prev.rooms, { id: createId("room"), ...values, active: true }],
    }));
    onClose();
  });

  return (
    <Modal
      open
      title={room ? "회의실 수정" : "회의실 추가"}
      onClose={onClose}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="room-form">
            {room ? "저장" : "추가"}
          </Button>
        </>
      }
    >
      <form id="room-form" onSubmit={submit} noValidate>
        <FormGrid>
          <div data-span="full">
            <Field label="회의실 이름" required error={errors.name?.message}>
              {(id) => (
                <Input
                  id={id}
                  placeholder="예: 소회의실 C"
                  autoFocus
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
              )}
            </Field>
          </div>
          <Field label="수용 인원" required error={errors.capacity?.message}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="예: 6"
                aria-invalid={!!errors.capacity}
                {...register("capacity")}
              />
            )}
          </Field>
          <Field label="위치" required error={errors.location?.message}>
            {(id) => <Input id={id} placeholder="예: 8층" aria-invalid={!!errors.location} {...register("location")} />}
          </Field>
          <div data-span="full">
            <Field label="장비" hint="쉼표(,)로 구분해 입력하세요.">
              {(id) => (
                <Input id={id} placeholder="예: TV, 화이트보드, 화상회의" {...register("equipment")} />
              )}
            </Field>
          </div>
        </FormGrid>
      </form>
    </Modal>
  );
}
