"use client";

import styled from "@emotion/styled";
import { Mail, Phone } from "lucide-react";
import { Avatar, Badge, Person, StatusBadge, Table, TableWrap } from "@/components/ui";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import { useDirectory } from "@/queries/directory";
import type { Member } from "@/types";

const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
`;

const CardButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  padding: 16px;
  text-align: left;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    box-shadow: ${({ theme }) => theme.shadows.md};
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  > div {
    flex: 1;
    min-width: 0;
  }

  strong {
    font-size: 15px;
  }

  p {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const Contact = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  }
`;

interface MemberListProps {
  members: Member[];
  view: "card" | "table";
  onSelect: (member: Member) => void;
}

export function MemberList({ members, view, onSelect }: MemberListProps) {
  const { getDepartmentName } = useDirectory();
  if (view === "table") {
    return (
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <th>이름</th>
              <th>부서</th>
              <th>직급</th>
              <th>상태</th>
              <th>이메일</th>
              <th>휴대폰</th>
              <th>내선</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} data-clickable="true" onClick={() => onSelect(m)}>
                <td>
                  <Person name={m.name} color={m.color} />
                </td>
                <td>{getDepartmentName(m.departmentId)}</td>
                <td>{m.position}</td>
                <td>
                  <StatusBadge value={MEMBER_STATUS[m.status]} />
                </td>
                <td>{m.email}</td>
                <td>{m.phone}</td>
                <td>{m.extension}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    );
  }

  return (
    <Grid>
      {members.map((m) => (
        <li key={m.id}>
          <CardButton type="button" onClick={() => onSelect(m)}>
            <CardTop>
              <Avatar name={m.name} color={m.color} size={44} />
              <div>
                <strong>{m.name}</strong> {m.role === "manager" && <Badge $tone="primary">{ROLE_LABELS.manager}</Badge>}
                <p>
                  {m.position} · {getDepartmentName(m.departmentId)}
                </p>
              </div>
              <StatusBadge value={MEMBER_STATUS[m.status]} />
            </CardTop>
            <Contact>
              <span>
                <Mail />
                {m.email}
              </span>
              <span>
                <Phone />
                {m.phone} · 내선 {m.extension}
              </span>
            </Contact>
          </CardButton>
        </li>
      ))}
    </Grid>
  );
}
