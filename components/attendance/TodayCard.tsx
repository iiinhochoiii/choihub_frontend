"use client";

import styled from "@emotion/styled";
import { LogIn, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { ATTENDANCE_STATUS, getAttendanceStatus, getWorkedMinutes } from "@/lib/attendance";
import { formatDuration, formatLongDate, nowTime, timeToMinutes, toDateKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { useCurrentUser, useData } from "@/lib/store";
import { mq } from "@/styles/theme";

const Wrap = styled(Card)`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  ${mq.md} {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    align-items: center;
  }
`;

const ClockBox = styled.div`
  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 4px;
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 40px;
    font-weight: 700;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
`;

const Info = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 16px;

  div {
    padding: 12px;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  dt {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    margin-top: 2px;
    font-size: 16px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
`;

const Actions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
`;

const Warn = styled.p`
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.warning};
`;

const pad = (n: number) => String(n).padStart(2, "0");

export function TodayCard() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const today = toDateKey(now);
  const record = data.attendance.find((r) => r.memberId === user.id && r.date === today);
  const status = getAttendanceStatus(record, data.company);
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // 근무중이면 현재 시각 기준으로 계산
  const worked = record?.checkIn
    ? record.checkOut
      ? getWorkedMinutes(record)
      : getWorkedMinutes({ ...record, checkOut: currentTime })
    : 0;

  const checkIn = () => {
    update((prev) => ({
      ...prev,
      attendance: [
        ...prev.attendance,
        { id: createId("a"), memberId: user.id, date: today, checkIn: nowTime(), checkOut: null },
      ],
    }));
  };

  const checkOut = () => {
    if (!record) return;
    update((prev) => ({
      ...prev,
      attendance: prev.attendance.map((r) =>
        r.id === record.id ? { ...r, checkOut: nowTime() } : r,
      ),
    }));
  };

  const isLateNow = timeToMinutes(currentTime) > timeToMinutes(data.company.workStart);

  return (
    <Wrap>
      <ClockBox>
        <p>{formatLongDate(now)}</p>
        <strong>
          {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
        </strong>
        <p style={{ marginTop: 8 }}>
          근무시간 {data.company.workStart} ~ {data.company.workEnd} ·{" "}
          <StatusBadge value={ATTENDANCE_STATUS[status]} />
        </p>
      </ClockBox>

      <div>
        <Info>
          <div>
            <dt>출근</dt>
            <dd>{record?.checkIn ?? "--:--"}</dd>
          </div>
          <div>
            <dt>퇴근</dt>
            <dd>{record?.checkOut ?? "--:--"}</dd>
          </div>
          <div>
            <dt>근무</dt>
            <dd>{worked > 0 ? formatDuration(worked) : "-"}</dd>
          </div>
        </Info>
        <Actions>
          <Button $size="lg" onClick={checkIn} disabled={!!record}>
            <LogIn />
            출근하기
          </Button>
          <Button
            $size="lg"
            $variant="secondary"
            onClick={checkOut}
            disabled={!record || !!record.checkOut}
          >
            <LogOut />
            퇴근하기
          </Button>
        </Actions>
        {!record && isLateNow && (
          <Warn>출근 기준 시각({data.company.workStart})이 지나 지각으로 기록됩니다.</Warn>
        )}
      </div>
    </Wrap>
  );
}
