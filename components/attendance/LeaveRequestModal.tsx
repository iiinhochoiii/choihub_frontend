"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button, Field, FormGrid, Input, Modal, Select, Textarea } from "@/components/ui";
import { getUsedLeaveDays } from "@/lib/attendance";
import { todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { LEAVE_TYPES } from "@/lib/labels";
import { getLeavePeriod, type LeaveRequestFormValues, leaveRequestSchema } from "@/lib/schemas/attendance";
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

const createDefaultValues = (): LeaveRequestFormValues => ({
  type: "annual",
  startDate: todayKey(),
  endDate: todayKey(),
  reason: "",
});

export function LeaveRequestModal({ open, onClose }: Props) {
  const { data, update } = useData();
  const user = useCurrentUser();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: createDefaultValues(),
  });

  const [type, startDate, endDate] = useWatch({ control, name: ["type", "startDate", "endDate"] });
  const { isHalf, days } = getLeavePeriod(type, startDate, endDate);

  const used = getUsedLeaveDays(data.leaveRequests, user.id);
  const pending = data.leaveRequests
    .filter((r) => r.memberId === user.id && r.status === "pending" && isAnnualType(r.type))
    .reduce((sum, r) => sum + r.days, 0);
  const available = user.annualLeaveTotal - used - pending;

  const close = () => {
    reset(createDefaultValues());
    onClose();
  };

  const submit = handleSubmit((values) => {
    const period = getLeavePeriod(values.type, values.startDate, values.endDate);
    if (isAnnualType(values.type) && period.days > available) {
      return setError("root", { message: `사용 가능한 연차(${available}일)를 초과합니다.` });
    }
    const overlap = data.leaveRequests.some(
      (r) =>
        r.memberId === user.id &&
        r.status !== "rejected" &&
        r.startDate <= period.endDate &&
        r.endDate >= values.startDate,
    );
    if (overlap) return setError("root", { message: "이미 신청한 휴가와 기간이 겹칩니다." });

    update((prev) => ({
      ...prev,
      leaveRequests: [
        ...prev.leaveRequests,
        {
          id: createId("l"),
          memberId: user.id,
          type: values.type,
          startDate: values.startDate,
          endDate: period.endDate,
          days: period.days,
          reason: values.reason,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    close();
  });

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
      <form id="leave-request-form" onSubmit={submit} noValidate>
        <FormGrid>
          <div data-span="full">
            <Field label="휴가 유형" required>
              {(id) => (
                <Select id={id} {...register("type")}>
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
            <Field label={isHalf ? "날짜" : "시작일"} required error={errors.startDate?.message}>
              {(id) => <Input id={id} type="date" aria-invalid={!!errors.startDate} {...register("startDate")} />}
            </Field>
          </div>
          {!isHalf && (
            <Field label="종료일" required error={errors.endDate?.message}>
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  min={startDate}
                  aria-invalid={!!errors.endDate}
                  {...register("endDate")}
                />
              )}
            </Field>
          )}
          <div data-span="full">
            <Field label="사유" required error={errors.reason?.message}>
              {(id) => (
                <Textarea
                  id={id}
                  placeholder="휴가 사유를 입력하세요"
                  style={{ minHeight: 88 }}
                  aria-invalid={!!errors.reason}
                  {...register("reason")}
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
        {errors.root && <ErrorText role="alert">{errors.root.message}</ErrorText>}
      </form>
    </Modal>
  );
}
