"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  ErrorState,
  LoadingState,
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
import { getDayStatusBadge } from "@/lib/attendance";
import { formatDate, formatMonthDay } from "@/lib/date";
import { LEAVE_TYPES } from "@/lib/labels";
import { useApproveLeave, useLeaveRequests, useRejectLeave, useTeamAttendance } from "@/queries/attendance";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { formatPeriod } from "./utils";

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

const ErrorText = styled.p`
  margin-bottom: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

export function TeamTab() {
  const user = useCurrentUser();
  const { getMember, getDepartmentName } = useDirectory();
  const pendingQuery = useLeaveRequests({ status: "pending" });
  const approve = useApproveLeave();
  const reject = useRejectLeave();
  // 처리 중인 신청(버튼 중복 클릭 방지)
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const reviewError = approve.error ?? reject.error;

  const review = (id: string, action: "approve" | "reject") => {
    approve.reset();
    reject.reset();
    setReviewingId(id);
    (action === "approve" ? approve : reject).mutate(id, { onSettled: () => setReviewingId(null) });
  };

  const pending = pendingQuery.data ?? [];

  return (
    <Stack $gap={20}>
      <Card>
        <CardHeader>
          <CardTitle>휴가 승인 대기 ({pending.length})</CardTitle>
          <Muted>내가 승인할 부서 구성원의 신청만 표시됩니다.</Muted>
        </CardHeader>
        {reviewError && <ErrorText role="alert">{getErrorMessage(reviewError)}</ErrorText>}
        {pendingQuery.isPending ? (
          <LoadingState />
        ) : pendingQuery.error ? (
          <ErrorState message={getErrorMessage(pendingQuery.error)} onRetry={() => pendingQuery.refetch()} />
        ) : (
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
                  const member = getMember(r.memberId);
                  return (
                    <tr key={r.id}>
                      <td>
                        {member && (
                          <Person
                            name={member.name}
                            color={member.color}
                            caption={getDepartmentName(member.departmentId)}
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
                            <Button
                              $size="sm"
                              disabled={reviewingId !== null}
                              onClick={() => review(r.id, "approve")}
                            >
                              승인
                            </Button>
                            <Button
                              $size="sm"
                              $variant="secondary"
                              disabled={reviewingId !== null}
                              onClick={() => review(r.id, "reject")}
                            >
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
        )}
      </Card>

      <TeamTodayCard />
    </Stack>
  );
}

/** 오늘 근태 현황: 서버가 판정한 상태와 집계를 그대로 보여 준다. */
function TeamTodayCard() {
  const { getMember, getDepartmentName } = useDirectory();
  const { data: team, isPending, error, refetch } = useTeamAttendance();

  if (isPending) {
    return (
      <Card>
        <LoadingState />
      </Card>
    );
  }
  if (error) {
    return (
      <Card>
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      </Card>
    );
  }

  const { counts } = team;
  const rows = team.rows.flatMap((row) => {
    const member = getMember(row.memberId);
    return member ? [{ ...row, member }] : [];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>오늘 근태 현황</CardTitle>
        <Muted>{formatMonthDay(team.date)}</Muted>
      </CardHeader>
      <Counts>
        <span>
          출근<strong>{counts.present}</strong>
        </span>
        <span>
          지각<strong>{counts.late}</strong>
        </span>
        <span>
          휴가<strong>{counts.leave}</strong>
        </span>
        <span>
          미출근<strong>{counts.absent}</strong>
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
                <MutedCell>{getDepartmentName(member.departmentId)}</MutedCell>
                <td>{record?.checkIn ?? "-"}</td>
                <td>{record?.checkOut ?? "-"}</td>
                <td>
                  <StatusBadge value={getDayStatusBadge(status, leave?.type)} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>
    </Card>
  );
}
