"use client";

import styled from "@emotion/styled";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge, IconButton, MutedCell, StatusBadge, Table, TableWrap } from "@/components/ui";
import { ATTENDANCE_STATUS, getAttendanceStatus, getWorkedMinutes } from "@/lib/attendance";
import { addMonths, formatDuration, formatMonthDay, isWeekend, toDateKey, todayKey } from "@/lib/date";
import { LEAVE_TYPES } from "@/lib/labels";
import { useCurrentUser, useData } from "@/lib/store";
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
  const { data } = useData();
  const user = useCurrentUser();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = todayKey();
  const currentMonthKey = today.slice(0, 7);
  const monthKey = toDateKey(month).slice(0, 7);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const rows = Array.from({ length: lastDay }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))
    .map((date) => {
      const key = toDateKey(date);
      return {
        key,
        date,
        record: data.attendance.find((r) => r.memberId === user.id && r.date === key),
        leave: findLeaveOn(data.leaveRequests, user.id, key),
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
                      <StatusBadge value={ATTENDANCE_STATUS[getAttendanceStatus(record, data.company)]} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </TableWrap>
    </div>
  );
}
