"use client";

import styled from "@emotion/styled";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Avatar, Badge, Button, Modal, Notice, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/date";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import { useDeleteMember, useDirectory } from "@/queries/directory";
import type { Member } from "@/types";

const Profile = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;

  strong {
    font-size: 18px;
  }

  p {
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const InfoList = styled.dl`
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 10px 12px;
  font-size: 14px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  a {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const DeleteNotice = styled(Notice)`
  margin-bottom: 16px;

  p + p {
    margin-top: 6px;
  }
`;

interface Props {
  member: Member | null;
  canEdit: boolean;
  /** 매니저이고 본인이 아닐 때 */
  canDelete: boolean;
  onEdit: (member: Member) => void;
  onClose: () => void;
}

export function MemberDetailModal({ member, canEdit, canDelete, onEdit, onClose }: Props) {
  const { getDepartmentName } = useDirectory();
  const remove = useDeleteMember();
  const [confirming, setConfirming] = useState(false);
  if (!member) return null;
  const [month, day] = member.birthday.split("-");

  const footer = confirming ? (
    <>
      <Button
        $variant="secondary"
        disabled={remove.isPending}
        onClick={() => {
          setConfirming(false);
          remove.reset();
        }}
      >
        취소
      </Button>
      <Button
        $variant="danger"
        disabled={remove.isPending}
        onClick={() => remove.mutate(member.id, { onSuccess: onClose })}
      >
        <Trash2 />
        삭제
      </Button>
    </>
  ) : (
    <>
      {canDelete && (
        <Button $variant="ghost" onClick={() => setConfirming(true)} style={{ marginRight: "auto" }}>
          <Trash2 />
          삭제
        </Button>
      )}
      <Button $variant="secondary" onClick={onClose}>
        닫기
      </Button>
      {canEdit && (
        <Button onClick={() => onEdit(member)}>
          <Pencil />
          수정
        </Button>
      )}
    </>
  );

  return (
    <Modal open title="구성원 정보" onClose={onClose} width={460} footer={footer}>
      {confirming && (
        <DeleteNotice $tone="warning" role="alert">
          <p>
            <strong>{member.name}</strong>님을 삭제할까요? 더 이상 로그인할 수 없고 구성원 목록에서 빠집니다.
          </p>
          <p>작성한 결재 문서·게시글·근태 기록은 남으며, 작성자는 &quot;삭제된 구성원&quot;으로 표시됩니다.</p>
          {remove.error && <p>{getErrorMessage(remove.error)}</p>}
        </DeleteNotice>
      )}
      <Profile>
        <Avatar name={member.name} color={member.color} size={56} />
        <div>
          <strong>{member.name}</strong>{" "}
          <Badge $tone={member.role === "manager" ? "primary" : "neutral"}>{ROLE_LABELS[member.role]}</Badge>
          <p>
            {getDepartmentName(member.departmentId)} · {member.position}
          </p>
        </div>
      </Profile>
      <InfoList>
        <dt>상태</dt>
        <dd>
          <StatusBadge value={MEMBER_STATUS[member.status]} />
        </dd>
        <dt>이메일</dt>
        <dd>
          <a href={`mailto:${member.email}`}>{member.email}</a>
        </dd>
        <dt>휴대폰</dt>
        <dd>
          <a href={`tel:${member.phone}`}>{member.phone}</a>
        </dd>
        <dt>내선번호</dt>
        <dd>{member.extension || "-"}</dd>
        <dt>입사일</dt>
        <dd>{formatDate(member.joinedAt)}</dd>
        <dt>생일</dt>
        <dd>{month && day ? `${Number(month)}월 ${Number(day)}일` : "-"}</dd>
        {/* 연차는 매니저와 본인에게만 내려온다. */}
        {canEdit && member.annualLeaveTotal !== undefined && (
          <>
            <dt>연차</dt>
            <dd>연 {member.annualLeaveTotal}일</dd>
          </>
        )}
      </InfoList>
    </Modal>
  );
}
