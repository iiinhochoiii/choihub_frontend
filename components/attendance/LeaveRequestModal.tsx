"use client";

import styled from "@emotion/styled";
import { useState } from "react";
import { Button, Field, FormGrid, Input, Modal, Select, Textarea } from "@/components/ui";
import { getUsedLeaveDays } from "@/lib/attendance";
import { countWeekdays, todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { LEAVE_TYPES } from "@/lib/labels";
import { useCurrentUser, useData } from "@/lib/store";
import type { LeaveType } from "@/lib/types";
import { isAnnualType } from "./utils";

const Summary = styled.p`
  margin-top: 16px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const ErrorText = styled.p`
  margin-top: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LeaveRequestModal({ open, onClose }: Props) {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [type, setType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState(() => todayKey());
  const [endDate, setEndDate] = useState(() => todayKey());
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const isHalf = LEAVE_TYPES[type].days !== null;
  const effectiveEnd = isHalf ? startDate : endDate;
  const days =
    !startDate || !effectiveEnd || effectiveEnd < startDate
      ? 0
      : isHalf
        ? 0.5
        : countWeekdays(startDate, effectiveEnd);

  const used = getUsedLeaveDays(data.leaveRequests, user.id);
  const pending = data.leaveRequests
    .filter((r) => r.memberId === user.id && r.status === "pending" && isAnnualType(r.type))
    .reduce((sum, r) => sum + r.days, 0);
  const available = user.annualLeaveTotal - used - pending;

  const reset = () => {
    setType("annual");
    setStartDate(todayKey());
    setEndDate(todayKey());
    setReason("");
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !effectiveEnd) return setError("기간을 입력하세요.");
    if (effectiveEnd < startDate) return setError("종료일이 시작일보다 빠릅니다.");
    if (days <= 0) return setError("선택한 기간에 평일이 없습니다.");
    if (isAnnualType(type) && days > available) {
      return setError(`사용 가능한 연차(${available}일)를 초과합니다.`);
    }
    const overlap = data.leaveRequests.some(
      (r) =>
        r.memberId === user.id &&
        r.status !== "rejected" &&
        r.startDate <= effectiveEnd &&
        r.endDate >= startDate,
    );
    if (overlap) return setError("이미 신청한 휴가와 기간이 겹칩니다.");
    if (!reason.trim()) return setError("사유를 입력하세요.");

    update((prev) => ({
      ...prev,
      leaveRequests: [
        ...prev.leaveRequests,
        {
          id: createId("l"),
          memberId: user.id,
          type,
          startDate,
          endDate: effectiveEnd,
          days,
          reason: reason.trim(),
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    close();
  };

  return (
    <Modal
      open={open}
      title="휴가 신청"
      onClose={close}
      footer={
        <>
          <Button $variant="secondary" onClick={close}>
            취소
          </Button>
          <Button type="submit" form="leave-request-form">
            신청하기
          </Button>
        </>
      }
    >
      <form id="leave-request-form" onSubmit={submit}>
        <FormGrid>
          <div data-span="full">
            <Field label="휴가 유형" required>
              {(id) => (
                <Select id={id} value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
                  {(Object.keys(LEAVE_TYPES) as LeaveType[]).map((key) => (
                    <option key={key} value={key}>
                      {LEAVE_TYPES[key].label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </div>
          <div data-span={isHalf ? "full" : undefined}>
            <Field label={isHalf ? "날짜" : "시작일"} required>
              {(id) => (
                <Input id={id} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              )}
            </Field>
          </div>
          {!isHalf && (
            <Field label="종료일" required>
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              )}
            </Field>
          )}
          <div data-span="full">
            <Field label="사유" required>
              {(id) => (
                <Textarea
                  id={id}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="휴가 사유를 입력하세요"
                  style={{ minHeight: 88 }}
                />
              )}
            </Field>
          </div>
        </FormGrid>
        <Summary>
          신청 일수 <strong>{days}일</strong>
          {isAnnualType(type) && (
            <>
              {" "}
              · 사용 가능 연차 <strong>{available}일</strong>
            </>
          )}
          {!isAnnualType(type) && " · 연차에서 차감되지 않습니다."}
        </Summary>
        {error && <ErrorText role="alert">{error}</ErrorText>}
      </form>
    </Modal>
  );
}
