"use client";

import styled from "@emotion/styled";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  MutedCell,
  Person,
  Row,
  Stack,
  StatusBadge,
  Table,
  TableWrap,
  TitleCell,
  Muted,
} from "@/components/ui";
import { ATTENDANCE_STATUS, getAttendanceStatus, type AttendanceStatus } from "@/lib/attendance";
import { formatDate, formatMonthDay, todayKey } from "@/lib/date";
import { LEAVE_TYPES } from "@/lib/labels";
import { getDepartmentName, getMember } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { RequestStatus } from "@/lib/types";
import { findLeaveOn, formatPeriod } from "./utils";

const Counts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;

  span {
    padding: 6px 12px;
    border-radius: ${({ theme }) => theme.radii.full};
    background: ${({ theme }) => theme.colors.surfaceMuted};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    margin-left: 4px;
    color: ${({ theme }) => theme.colors.text};
  }
`;

type TeamStatus = AttendanceStatus | "leave";

export function TeamTab() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const today = todayKey();

  const rows = data.members.map((member) => {
    const record = data.attendance.find((r) => r.memberId === member.id && r.date === today);
    const leave = findLeaveOn(data.leaveRequests, member.id, today);
    const status: TeamStatus = leave && !record ? "leave" : getAttendanceStatus(record, data.company);
    return { member, record, leave, status };
  });

  const count = (statuses: TeamStatus[]) => rows.filter((r) => statuses.includes(r.status)).length;

  const pending = data.leaveRequests
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const review = (id: string, status: RequestStatus) => {
    update((prev) => ({
      ...prev,
      leaveRequests: prev.leaveRequests.map((r) =>
        r.id === id ? { ...r, status, reviewerId: user.id } : r,
      ),
    }));
  };

  return (
    <Stack $gap={20}>
      <Card>
        <CardHeader>
          <CardTitle>휴가 승인 대기 ({pending.length})</CardTitle>
        </CardHeader>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>신청자</th>
                <th>유형</th>
                <th>기간</th>
                <th>일수</th>
                <th>사유</th>
                <th>신청일</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <MutedCell colSpan={7} style={{ textAlign: "center", padding: 28 }}>
                    승인 대기 중인 휴가가 없습니다.
                  </MutedCell>
                </tr>
              )}
              {pending.map((r) => {
                const member = getMember(data, r.memberId);
                return (
                  <tr key={r.id}>
                    <td>
                      {member && (
                        <Person
                          name={member.name}
                          color={member.color}
                          caption={getDepartmentName(data, member.departmentId)}
                        />
                      )}
                    </td>
                    <td>{LEAVE_TYPES[r.type].label}</td>
                    <td>{formatPeriod(r.startDate, r.endDate)}</td>
                    <td>{r.days}일</td>
                    <TitleCell $maxWidth={200}>{r.reason}</TitleCell>
                    <MutedCell>{formatDate(r.createdAt)}</MutedCell>
                    <td>
                      {r.memberId === user.id ? (
                        <Muted>본인 신청</Muted>
                      ) : (
                        <Row $wrap={false} $gap={6}>
                          <Button $size="sm" onClick={() => review(r.id, "approved")}>
                            승인
                          </Button>
                          <Button $size="sm" $variant="secondary" onClick={() => review(r.id, "rejected")}>
                            반려
                          </Button>
                        </Row>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>오늘 근태 현황</CardTitle>
          <Muted>{formatMonthDay(today)}</Muted>
        </CardHeader>
        <Counts>
          <span>
            출근<strong>{count(["normal", "working", "early", "late"])}</strong>
          </span>
          <span>
            지각<strong>{count(["late"])}</strong>
          </span>
          <span>
            휴가<strong>{count(["leave"])}</strong>
          </span>
          <span>
            미출근<strong>{count(["absent"])}</strong>
          </span>
        </Counts>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>이름</th>
                <th>부서</th>
                <th>출근</th>
                <th>퇴근</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ member, record, leave, status }) => (
                <tr key={member.id}>
                  <td>
                    <Person name={member.name} color={member.color} caption={member.position} />
                  </td>
                  <MutedCell>{getDepartmentName(data, member.departmentId)}</MutedCell>
                  <td>{record?.checkIn ?? "-"}</td>
                  <td>{record?.checkOut ?? "-"}</td>
                  <td>
                    {status === "leave" && leave ? (
                      <Badge $tone="info">{LEAVE_TYPES[leave.type].label}</Badge>
                    ) : (
                      <StatusBadge value={ATTENDANCE_STATUS[status as AttendanceStatus]} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </Card>
    </Stack>
  );
}
