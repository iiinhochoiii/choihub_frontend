"use client";

import styled from "@emotion/styled";
import { AlarmClock, CalendarCheck, Palmtree, Timer } from "lucide-react";
import { getAttendanceStatus, getUsedLeaveDays, getWorkedMinutes } from "@/lib/attendance";
import { formatDuration, todayKey } from "@/lib/date";
import { useCurrentUser, useData } from "@/lib/store";
import { mq } from "@/styles/theme";
import { isAnnualType } from "./utils";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  ${mq.lg} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const Tile = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  min-width: 0;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};

  span {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  svg {
    width: 16px;
    height: 16px;
  }

  strong {
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

export function SummaryCards() {
  const { data } = useData();
  const user = useCurrentUser();
  const monthKey = todayKey().slice(0, 7);

  const records = data.attendance.filter(
    (r) => r.memberId === user.id && r.date.startsWith(monthKey) && r.checkIn,
  );
  const totalMinutes = records.reduce((sum, r) => sum + getWorkedMinutes(r), 0);
  const lateCount = records.filter((r) => getAttendanceStatus(r, data.company) === "late").length;

  const used = getUsedLeaveDays(data.leaveRequests, user.id);
  const pending = data.leaveRequests
    .filter((r) => r.memberId === user.id && r.status === "pending" && isAnnualType(r.type))
    .reduce((sum, r) => sum + r.days, 0);
  const remaining = user.annualLeaveTotal - used;

  return (
    <Grid>
      <Tile>
        <span>
          <CalendarCheck />
          이번 달 근무일
        </span>
        <strong>{records.length}일</strong>
        <small>{Number(monthKey.slice(5))}월 출근 기록 기준</small>
      </Tile>
      <Tile>
        <span>
          <Timer />
          이번 달 근무시간
        </span>
        <strong>{formatDuration(totalMinutes)}</strong>
        <small>
          일 평균 {records.length ? formatDuration(Math.round(totalMinutes / records.length)) : "-"}
        </small>
      </Tile>
      <Tile>
        <span>
          <AlarmClock />
          지각
        </span>
        <strong>{lateCount}회</strong>
        <small>출근 기준 {data.company.workStart}</small>
      </Tile>
      <Tile>
        <span>
          <Palmtree />
          잔여 연차
        </span>
        <strong>
          {remaining}일 <small>/ {user.annualLeaveTotal}일</small>
        </strong>
        <small>
          사용 {used}일{pending > 0 && ` · 승인 대기 ${pending}일`}
        </small>
      </Tile>
    </Grid>
  );
}
