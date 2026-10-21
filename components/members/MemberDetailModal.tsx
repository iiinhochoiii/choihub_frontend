"use client";

import styled from "@emotion/styled";
import { Pencil } from "lucide-react";
import { Avatar, Badge, Button, Modal, StatusBadge } from "@/components/ui";
import { formatDate } from "@/lib/date";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import { getDepartmentName } from "@/lib/selectors";
import type { GroupwareData, Member } from "@/lib/types";

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

interface Props {
  data: GroupwareData;
  member: Member | null;
  canEdit: boolean;
  onEdit: (member: Member) => void;
  onClose: () => void;
}

export function MemberDetailModal({ data, member, canEdit, onEdit, onClose }: Props) {
  if (!member) return null;
  const [month, day] = member.birthday.split("-");

  return (
    <Modal
      open
      title="구성원 정보"
      onClose={onClose}
      width={460}
      footer={
        <>
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
      }
    >
      <Profile>
        <Avatar name={member.name} color={member.color} size={56} />
        <div>
          <strong>{member.name}</strong>{" "}
          <Badge $tone={member.role === "manager" ? "primary" : "neutral"}>{ROLE_LABELS[member.role]}</Badge>
          <p>
            {getDepartmentName(data, member.departmentId)} · {member.position}
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
        {canEdit && (
          <>
            <dt>연차</dt>
            <dd>연 {member.annualLeaveTotal}일</dd>
          </>
        )}
      </InfoList>
    </Modal>
  );
}
