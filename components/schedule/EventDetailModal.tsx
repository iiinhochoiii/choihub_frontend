"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { Badge, Button, Dot, Modal, Muted, Person } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { formatMonthDay } from "@/lib/date";
import { EVENT_CATEGORIES } from "@/lib/labels";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { useDeleteEvent } from "@/queries/events";
import type { CalendarEvent } from "@/types";
import { UNKNOWN_MEMBER_NAME } from "@/lib/selectors";

const Info = styled.dl`
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px 8px;
  font-size: 14px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    white-space: pre-line;
    word-break: break-word;
  }
`;

const ErrorText = styled.p`
  margin-top: 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

interface Props {
  event: CalendarEvent;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: Props) {
  const user = useCurrentUser();
  const { getMember, getMemberSummary } = useDirectory();
  const deleteEvent = useDeleteEvent();
  const [confirming, setConfirming] = useState(false);
  const owner = getMember(event.ownerId);
  const category = EVENT_CATEGORIES[event.category];
  // 버튼 노출용. 권한은 서버가 다시 검사한다.
  const canDelete = event.ownerId === user.id || user.isManager;

  const remove = () => {
    deleteEvent.mutate(event.id, { onSuccess: onClose });
  };

  const footer = confirming ? (
    <>
      <Muted style={{ marginRight: "auto", alignSelf: "center" }}>이 일정을 삭제할까요?</Muted>
      <Button $variant="secondary" onClick={() => setConfirming(false)}>
        취소
      </Button>
      <Button $variant="danger" onClick={remove} disabled={deleteEvent.isPending}>
        삭제
      </Button>
    </>
  ) : (
    <>
      {canDelete && (
        <Button $variant="ghost" onClick={() => setConfirming(true)} style={{ marginRight: "auto" }}>
          삭제
        </Button>
      )}
      <Button $variant="secondary" onClick={onClose}>
        닫기
      </Button>
    </>
  );

  return (
    <Modal open title={event.title} onClose={onClose} width={460} footer={footer}>
      <Info>
        <dt>분류</dt>
        <dd>
          <Dot $color={category.color} />
          {category.label}
          <Badge $tone={event.shared ? "primary" : "neutral"}>{event.shared ? "전체 공개" : "비공개"}</Badge>
        </dd>
        <dt>일시</dt>
        <dd>
          {formatMonthDay(event.date)} · {event.allDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
        </dd>
        <dt>등록자</dt>
        <dd>
          {owner ? (
            <Person name={owner.name} color={owner.color} caption={getMemberSummary(owner.id)} />
          ) : (
            UNKNOWN_MEMBER_NAME
          )}
        </dd>
        <dt>설명</dt>
        <dd>{event.description || <Muted>설명 없음</Muted>}</dd>
      </Info>
      {deleteEvent.error && <ErrorText role="alert">{getErrorMessage(deleteEvent.error)}</ErrorText>}
    </Modal>
  );
}
