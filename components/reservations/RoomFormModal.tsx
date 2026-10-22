"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, FormGrid, Input, Modal } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { setServerErrors } from "@/lib/form";
import { type RoomFormInput, type RoomFormValues, roomSchema } from "@/lib/schemas/reservation";
import { useCreateRoom, useUpdateRoom } from "@/queries/reservations";
import type { Room } from "@/types";

const ErrorText = styled.p`
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

interface Props {
  /** 없으면 신규 추가 */
  room?: Room;
  onClose: () => void;
}

/** 열릴 때마다 새로 마운트되어 room 값으로 초기화된다. */
export function RoomFormModal({ room, onClose }: Props) {
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const saving = createRoom.isPending || updateRoom.isPending;
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

  // 같은 이름 중복은 서버가 name 필드 오류로 돌려준다.
  const submit = handleSubmit((values) => {
    const options = {
      onSuccess: onClose,
      onError: (err: unknown) => {
        if (!setServerErrors(err, setError)) setError("root", { message: getErrorMessage(err) });
      },
    };
    if (room) updateRoom.mutate({ id: room.id, body: values }, options);
    else createRoom.mutate(values, options);
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
          <Button type="submit" form="room-form" disabled={saving}>
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
            <Field label="장비" hint="쉼표(,)로 구분해 입력하세요." error={errors.equipment?.message}>
              {(id) => (
                <Input id={id} placeholder="예: TV, 화이트보드, 화상회의" {...register("equipment")} />
              )}
            </Field>
          </div>
        </FormGrid>
        {errors.root && <ErrorText role="alert">{errors.root.message}</ErrorText>}
      </form>
    </Modal>
  );
}
