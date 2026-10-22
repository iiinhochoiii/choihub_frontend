"use client";

import styled from "@emotion/styled";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  Badge,
  ErrorState,
  IconButton,
  LoadingState,
  MutedCell,
  StatusBadge,
  Table,
  TableWrap,
} from "@/components/ui";
import { ATTENDANCE_STATUS, getAttendanceStatus, getWorkedMinutes } from "@/lib/attendance";
import { addMonths, formatDuration, formatMonthDay, isWeekend, toDateKey, todayKey } from "@/lib/date";
import { LEAVE_TYPES } from "@/lib/labels";
import { useMyAttendance, useMyLeaveRequests, useTodayAttendance } from "@/queries/attendance";
import { useCurrentUser } from "@/queries/auth";
import { useCompany } from "@/queries/directory";
import { findLeaveOn } from "./utils";

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;

  strong {
    min-width: 110px;
    text-align: center;
    font-size: 15px;
  }
`;

export function RecordsTab() {
  const user = useCurrentUser();
  const company = useCompany();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // 오늘은 서버(회사 시간대) 기준. 받기 전에는 브라우저 날짜로 대신한다.
  const today = useTodayAttendance().data?.date ?? todayKey();
  const currentMonthKey = today.slice(0, 7);
  const monthKey = toDateKey(month).slice(0, 7);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const { data: records, isPending, error, refetch } = useMyAttendance(monthKey);
  const leaveQuery = useMyLeaveRequests();
  const leaves = leaveQuery.data ?? [];

  const rows = Array.from(
    { length: lastDay },
    (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
  )
    .map((date) => {
      const key = toDateKey(date);
      return {
        key,
        date,
        record: records?.find((r) => r.date === key),
        leave: findLeaveOn(leaves, user.id, key),
      };
    })
    .filter((row) => row.key <= today && (!isWeekend(row.date) || row.record))
    .reverse();

  return (
    <div>
      <MonthNav>
        <IconButton aria-label="이전 달" onClick={() => setMonth((m) => addMonths(m, -1))}>
          <ChevronLeft />
        </IconButton>
        <strong>
          {month.getFullYear()}년 {month.getMonth() + 1}월
        </strong>
        <IconButton
          aria-label="다음 달"
          disabled={monthKey >= currentMonthKey}
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight />
        </IconButton>
      </MonthNav>

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>출근</th>
                <th>퇴근</th>
                <th>근무시간</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <MutedCell colSpan={5} style={{ textAlign: "center", padding: 32 }}>
                    기록이 없습니다.
                  </MutedCell>
                </tr>
              )}
              {rows.map(({ key, record, leave }) => {
                const minutes = getWorkedMinutes(record);
                return (
                  <tr key={key}>
                    <td>{formatMonthDay(key)}</td>
                    <td>{record?.checkIn ?? "-"}</td>
                    <td>{record?.checkOut ?? "-"}</td>
                    <MutedCell>{minutes ? formatDuration(minutes) : "-"}</MutedCell>
                    <td>
                      {leave && !record ? (
                        <Badge $tone="info">{LEAVE_TYPES[leave.type].label}</Badge>
                      ) : (
                        <StatusBadge value={ATTENDANCE_STATUS[getAttendanceStatus(record, company)]} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </div>
  );
}
