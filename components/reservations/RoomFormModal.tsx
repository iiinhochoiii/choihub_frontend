"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { Button, Field, FormGrid, Input, Modal } from "@/components/ui";
import { createId } from "@/lib/id";
import { useData } from "@/lib/store";
import type { Room } from "@/lib/types";

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
  const { data, update } = useData();
  const [name, setName] = useState(room?.name ?? "");
  const [capacity, setCapacity] = useState(room ? String(room.capacity) : "");
  const [location, setLocation] = useState(room?.location ?? "");
  const [equipment, setEquipment] = useState(room?.equipment.join(", ") ?? "");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const capacityNumber = Number(capacity);
    if (!trimmed) return setError("회의실 이름을 입력하세요.");
    if (data.rooms.some((r) => r.id !== room?.id && r.name === trimmed)) {
      return setError("같은 이름의 회의실이 이미 있습니다.");
    }
    if (!Number.isInteger(capacityNumber) || capacityNumber < 1 || capacityNumber > 500) {
      return setError("수용 인원은 1~500 사이의 정수로 입력하세요.");
    }
    if (!location.trim()) return setError("위치를 입력하세요.");

    const values = {
      name: trimmed,
      capacity: capacityNumber,
      location: location.trim(),
      equipment: equipment
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    update((prev) => ({
      ...prev,
      rooms: room
        ? prev.rooms.map((r) => (r.id === room.id ? { ...r, ...values } : r))
        : [...prev.rooms, { id: createId("room"), ...values, active: true }],
    }));
    onClose();
  };

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
      <form id="room-form" onSubmit={submit}>
        <FormGrid>
          <div data-span="full">
            <Field label="회의실 이름" required>
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  placeholder="예: 소회의실 C"
                  autoFocus
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
          </div>
          <Field label="수용 인원" required>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={1}
                inputMode="numeric"
                value={capacity}
                placeholder="예: 6"
                onChange={(e) => setCapacity(e.target.value)}
              />
            )}
          </Field>
          <Field label="위치" required>
            {(id) => (
              <Input id={id} value={location} placeholder="예: 8층" onChange={(e) => setLocation(e.target.value)} />
            )}
          </Field>
          <div data-span="full">
            <Field label="장비" hint="쉼표(,)로 구분해 입력하세요.">
              {(id) => (
                <Input
                  id={id}
                  value={equipment}
                  placeholder="예: TV, 화이트보드, 화상회의"
                  onChange={(e) => setEquipment(e.target.value)}
                />
              )}
            </Field>
          </div>
        </FormGrid>
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </form>
    </Modal>
  );
}
