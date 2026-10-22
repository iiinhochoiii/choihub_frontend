"use client";

import styled from "@emotion/styled";
import { ArrowDown, ArrowLeft, ArrowUp, Info, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  LoadingState,
  Modal,
  MutedCell,
  Notice,
  PageHeader,
  Row,
  Table,
  TableWrap,
} from "@/components/ui";
import { ApiError, getErrorMessage } from "@/apis/defaultInstance";
import {
  useActivateRoom,
  useDeactivateRoom,
  useDeleteRoom,
  useReorderRooms,
  useRooms,
} from "@/queries/reservations";
import type { Room } from "@/types";
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

const ErrorText = styled.p`
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

type FormState = { mode: "create" } | { mode: "edit"; room: Room } | null;

export function RoomManager() {
  const { data: rooms, isPending, error, refetch } = useRooms();
  const reorderRooms = useReorderRooms();
  const activateRoom = useActivateRoom();
  const deactivateRoom = useDeactivateRoom();
  const deleteRoom = useDeleteRoom();
  const [form, setForm] = useState<FormState>(null);
  const [deactivating, setDeactivating] = useState<Room | null>(null);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState<Room | null>(null);
  /** 앞으로 잡힌 예약이 있어 삭제가 막힌 회의실과 서버 안내 문구 */
  const [blockedDelete, setBlockedDelete] = useState<{ room: Room; message: string } | null>(null);

  /** 순서 변경은 화면에 먼저 반영하고(낙관적 업데이트) 실패하면 되돌린다. */
  const move = (index: number, direction: -1 | 1) => {
    if (!rooms) return;
    const target = index + direction;
    if (target < 0 || target >= rooms.length) return;
    const ids = rooms.map((room) => room.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderRooms.mutate(ids, { onError: (err) => window.alert(getErrorMessage(err)) });
  };

  const activate = (room: Room) =>
    activateRoom.mutate(room.id, { onError: (err) => window.alert(getErrorMessage(err)) });

  const openDeactivate = (room: Room) => {
    setReason("");
    deactivateRoom.reset();
    setDeactivating(room);
  };

  const closeDelete = () => {
    setDeleting(null);
    deleteRoom.reset();
  };

  // 끝나지 않은 예약이 있으면 서버가 409로 막는다. 사용 중지를 안내하는 창으로 바꿔 보여 준다.
  const remove = (room: Room) =>
    deleteRoom.mutate(room.id, {
      onSuccess: closeDelete,
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) {
          closeDelete();
          setBlockedDelete({ room, message: err.message });
        }
      },
    });

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

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : rooms.length === 0 ? (
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
                <th style={{ width: 150 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, index) => (
                <tr key={room.id}>
                  <td>
                    <Row $gap={0} $wrap={false}>
                      <IconButton $size={28} aria-label="위로" disabled={index === 0 || reorderRooms.isPending}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp />
                      </IconButton>
                      <IconButton
                        $size={28}
                        aria-label="아래로"
                        disabled={index === rooms.length - 1 || reorderRooms.isPending}
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
                  <td>
                    <Row $gap={0} $wrap={false}>
                      <IconButton aria-label={`${room.name} 수정`} title="수정" onClick={() => setForm({ mode: "edit", room })}>
                        <Pencil />
                      </IconButton>
                      <IconButton
                        aria-label={room.active ? `${room.name} 사용 중지` : `${room.name} 사용 재개`}
                        title={room.active ? "사용 중지" : "사용 재개"}
                        disabled={!room.active && activateRoom.isPending}
                        onClick={() => (room.active ? openDeactivate(room) : activate(room))}
                      >
                        <Power />
                      </IconButton>
                      <IconButton aria-label={`${room.name} 삭제`} title="삭제" onClick={() => setDeleting(room)}>
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
              disabled={deactivateRoom.isPending}
              onClick={() =>
                deactivating &&
                deactivateRoom.mutate(
                  { id: deactivating.id, reason: reason.trim() || undefined },
                  { onSuccess: () => setDeactivating(null) },
                )
              }
            >
              사용 중지
            </Button>
          </>
        }
      >
        {deactivating && (
          <>
            <p style={{ marginBottom: 16 }}>
              <strong>{deactivating.name}</strong>의 새 예약을 받지 않습니다. 이미 잡힌 예약은 그대로 유지되니
              예약자에게 따로 안내해 주세요.
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

      <Modal
        open={deleting !== null}
        title="회의실 삭제"
        width={400}
        onClose={closeDelete}
        footer={
          <>
            <Button $variant="secondary" onClick={closeDelete}>
              취소
            </Button>
            <Button
              $variant="danger"
              disabled={deleteRoom.isPending}
              onClick={() => deleting && remove(deleting)}
            >
              삭제
            </Button>
          </>
        }
      >
        <p style={{ whiteSpace: "pre-line" }}>
          {`${deleting?.name ?? ""}을(를) 삭제합니다.\n지난 예약 기록은 회의실 이름과 함께 남습니다.`}
        </p>
        {deleteRoom.error && <ErrorText role="alert">{getErrorMessage(deleteRoom.error)}</ErrorText>}
      </Modal>

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
                  openDeactivate(blockedDelete.room);
                  setBlockedDelete(null);
                }}
              >
                사용 중지하기
              </Button>
            )}
          </>
        }
      >
        {blockedDelete && <p>{blockedDelete.message}</p>}
      </Modal>
    </>
  );
}
