"use client";

import styled from "@emotion/styled";
import { AlarmClock, CalendarCheck, Palmtree, Timer } from "lucide-react";
import { getErrorMessage } from "@/apis/defaultInstance";
import { ErrorState, LoadingState } from "@/components/ui";
import { getAttendanceStatus, getWorkedMinutes } from "@/lib/attendance";
import { formatDuration } from "@/lib/date";
import { useLeaveBalance, useMyAttendance, useTodayAttendance } from "@/queries/attendance";
import { useCompany } from "@/queries/directory";
import { mq } from "@/styles/theme";

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
  const company = useCompany();
  // 이번 달은 서버 기준 오늘로 정한다.
  const todayQuery = useTodayAttendance();
  const monthKey = todayQuery.data?.date.slice(0, 7) ?? "";
  const attendance = useMyAttendance(monthKey, !!monthKey);
  const balance = useLeaveBalance();

  // 오늘 조회 실패는 TodayCard가 보여 주므로 여기서는 월 기록·잔액 오류만 다룬다.
  const error = attendance.error ?? balance.error;
  if (error) {
    return (
      <ErrorState
        message={getErrorMessage(error)}
        onRetry={() => {
          void attendance.refetch();
          void balance.refetch();
        }}
      />
    );
  }
  if (!attendance.data || !balance.data) return todayQuery.error ? null : <LoadingState />;

  const records = attendance.data.filter((r) => r.checkIn);
  const totalMinutes = records.reduce((sum, r) => sum + getWorkedMinutes(r), 0);
  const lateCount = records.filter((r) => getAttendanceStatus(r, company) === "late").length;

  // 연차 잔액은 서버가 계산한다.
  const { total, used, pending, available } = balance.data;

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
        <small>출근 기준 {company.workStart}</small>
      </Tile>
      <Tile>
        <span>
          <Palmtree />
          잔여 연차
        </span>
        <strong>
          {available}일 <small>/ {total}일</small>
        </strong>
        <small>
          사용 {used}일{pending > 0 && ` · 승인 대기 ${pending}일`}
        </small>
      </Tile>
    </Grid>
  );
}
