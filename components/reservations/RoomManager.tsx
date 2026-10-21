"use client";

import styled from "@emotion/styled";
import { ArrowDown, ArrowLeft, ArrowUp, Info, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  ConfirmModal,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  MutedCell,
  Notice,
  PageHeader,
  Row,
  Table,
  TableWrap,
} from "@/components/ui";
import { nowTime, todayKey } from "@/lib/date";
import { useData } from "@/lib/store";
import type { Reservation, Room } from "@/lib/types";
import { RoomFormModal } from "./RoomFormModal";

const NameCell = styled.td`
  strong {
    display: block;
    font-weight: 600;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const MutedSmall = styled.small`
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 아직 끝나지 않은 예약 (오늘 이후 + 오늘 중 종료 전) */
function isUpcoming(reservation: Reservation, today: string, now: string): boolean {
  return reservation.date > today || (reservation.date === today && reservation.endTime > now);
}

type FormState = { mode: "create" } | { mode: "edit"; room: Room } | null;

export function RoomManager() {
  const { data, update } = useData();
  const [form, setForm] = useState<FormState>(null);
  const [deactivating, setDeactivating] = useState<Room | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState<Room | null>(null);
  const [blockedDelete, setBlockedDelete] = useState<{ room: Room; count: number } | null>(null);

  const today = todayKey();
  const now = nowTime();
  const upcomingCount = (roomId: string) =>
    data.reservations.filter((r) => r.roomId === roomId && isUpcoming(r, today, now)).length;

  const move = (index: number, direction: -1 | 1) => {
    update((prev) => {
      const rooms = [...prev.rooms];
      const target = index + direction;
      if (target < 0 || target >= rooms.length) return prev;
      [rooms[index], rooms[target]] = [rooms[target], rooms[index]];
      return { ...prev, rooms };
    });
  };

  const setActive = (roomId: string, active: boolean, inactiveReason?: string) => {
    update((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === roomId ? { ...r, active, inactiveReason: active ? undefined : inactiveReason } : r,
      ),
    }));
  };

  const requestDelete = (room: Room) => {
    const count = upcomingCount(room.id);
    if (count > 0) setBlockedDelete({ room, count });
    else setDeleting(room);
  };

  const remove = (room: Room) => {
    update((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== room.id),
      // 지난 예약 기록에는 회의실 이름을 남겨 둔다.
      reservations: prev.reservations.map((r) => (r.roomId === room.id ? { ...r, roomName: room.name } : r)),
    }));
  };

  return (
    <>
      <PageHeader
        title="회의실 관리"
        description="예약할 수 있는 회의실을 추가·수정하고, 공사나 점검 중인 회의실은 사용을 중지합니다."
        actions={
          <>
            <ButtonLink href="/dashboard/reservations" $variant="secondary">
              <ArrowLeft />
              예약 화면
            </ButtonLink>
            <Button onClick={() => setForm({ mode: "create" })}>
              <Plus />
              회의실 추가
            </Button>
          </>
        }
      />

      <Notice>
        <Info />
        <span>
          순서는 예약 시간표에 표시되는 순서입니다. 앞으로 잡힌 예약이 있는 회의실은 삭제할 수 없으니, 먼저 사용 중지한
          뒤 예약이 모두 끝나면 삭제하세요.
        </span>
      </Notice>

      {data.rooms.length === 0 ? (
        <EmptyState
          title="등록된 회의실이 없습니다"
          description="회의실을 추가하면 구성원이 예약할 수 있습니다."
          action={
            <Button onClick={() => setForm({ mode: "create" })}>
              <Plus />
              회의실 추가
            </Button>
          }
        />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>순서</th>
                <th>회의실</th>
                <th>수용 인원</th>
                <th>장비</th>
                <th>상태</th>
                <th>예정 예약</th>
                <th style={{ width: 150 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((room, index) => (
                <tr key={room.id}>
                  <td>
                    <Row $gap={0} $wrap={false}>
                      <IconButton $size={28} aria-label="위로" disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUp />
                      </IconButton>
                      <IconButton
                        $size={28}
                        aria-label="아래로"
                        disabled={index === data.rooms.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown />
                      </IconButton>
                    </Row>
                  </td>
                  <NameCell>
                    <strong>{room.name}</strong>
                    <small>{room.location}</small>
                  </NameCell>
                  <td>{room.capacity}인</td>
                  <MutedCell>{room.equipment.length ? room.equipment.join(", ") : "-"}</MutedCell>
                  <td>
                    {room.active ? (
                      <Badge $tone="success">사용 중</Badge>
                    ) : (
                      <span title={room.inactiveReason}>
                        <Badge $tone="neutral">사용 중지</Badge>
                        {room.inactiveReason && (
                          <MutedSmall>{room.inactiveReason}</MutedSmall>
                        )}
                      </span>
                    )}
                  </td>
                  <td>{upcomingCount(room.id)}건</td>
                  <td>
                    <Row $gap={0} $wrap={false}>
                      <IconButton aria-label={`${room.name} 수정`} title="수정" onClick={() => setForm({ mode: "edit", room })}>
                        <Pencil />
                      </IconButton>
                      <IconButton
                        aria-label={room.active ? `${room.name} 사용 중지` : `${room.name} 사용 재개`}
                        title={room.active ? "사용 중지" : "사용 재개"}
                        onClick={() => {
                          if (room.active) {
                            setReason("");
                            setDeactivating(room);
                          } else {
                            setActive(room.id, true);
                          }
                        }}
                      >
                        <Power />
                      </IconButton>
                      <IconButton aria-label={`${room.name} 삭제`} title="삭제" onClick={() => requestDelete(room)}>
                        <Trash2 />
                      </IconButton>
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      {form && (
        <RoomFormModal room={form.mode === "edit" ? form.room : undefined} onClose={() => setForm(null)} />
      )}

      <Modal
        open={deactivating !== null}
        title="회의실 사용 중지"
        width={440}
        onClose={() => setDeactivating(null)}
        footer={
          <>
            <Button $variant="secondary" onClick={() => setDeactivating(null)}>
              취소
            </Button>
            <Button
              $variant="danger"
              onClick={() => {
                if (deactivating) setActive(deactivating.id, false, reason.trim() || undefined);
                setDeactivating(null);
              }}
            >
              사용 중지
            </Button>
          </>
        }
      >
        {deactivating && (
          <>
            <p style={{ marginBottom: 16 }}>
              <strong>{deactivating.name}</strong>의 새 예약을 받지 않습니다.
              {upcomingCount(deactivating.id) > 0 &&
                ` 이미 잡힌 예약 ${upcomingCount(deactivating.id)}건은 그대로 유지되니 예약자에게 따로 안내해 주세요.`}
            </p>
            <Field label="사유" hint="예약 화면에 함께 표시됩니다.">
              {(id) => (
                <Input
                  id={id}
                  value={reason}
                  placeholder="예: 내부 공사 (11/30까지)"
                  onChange={(e) => setReason(e.target.value)}
                />
              )}
            </Field>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={deleting !== null}
        title="회의실 삭제"
        message={`${deleting?.name ?? ""}을(를) 삭제합니다.\n지난 예약 기록은 회의실 이름과 함께 남습니다.`}
        confirmLabel="삭제"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove(deleting)}
      />

      <Modal
        open={blockedDelete !== null}
        title="삭제할 수 없습니다"
        width={420}
        onClose={() => setBlockedDelete(null)}
        footer={
          <>
            <Button $variant="secondary" onClick={() => setBlockedDelete(null)}>
              닫기
            </Button>
            {blockedDelete?.room.active && (
              <Button
                onClick={() => {
                  setReason("");
                  setDeactivating(blockedDelete.room);
                  setBlockedDelete(null);
                }}
              >
                사용 중지하기
              </Button>
            )}
          </>
        }
      >
        {blockedDelete && (
          <p>
            <strong>{blockedDelete.room.name}</strong>에 앞으로 잡힌 예약이 {blockedDelete.count}건 있습니다. 먼저 사용
            중지해 새 예약을 막고, 예약이 모두 끝나거나 취소된 뒤 삭제하세요.
          </p>
        )}
      </Modal>
    </>
  );
}
