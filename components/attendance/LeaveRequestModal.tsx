"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Button, Field, FormGrid, Input, Modal, Select, Textarea } from "@/components/ui";
import { todayKey } from "@/lib/date";
import { setServerErrors } from "@/lib/form";
import { LEAVE_TYPES } from "@/lib/labels";
import { getLeavePeriod, type LeaveRequestFormValues, leaveRequestSchema } from "@/lib/schemas/attendance";
import { useCreateLeaveRequest, useLeaveBalance } from "@/queries/attendance";
import { useCurrentUser } from "@/queries/auth";
import type { LeaveType } from "@/types";
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
  const { data: balance } = useLeaveBalance();
  // 매니저 본인의 휴가는 승인 절차 없이 바로 승인된다. 직원은 소속 부서의 매니저가 승인한다.
  const { isManager } = useCurrentUser();
  const createLeave = useCreateLeaveRequest();
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

  // 일수는 미리보기용. 실제 일수·잔액·중복·주말 검사는 서버가 한다.
  const [type, startDate, endDate] = useWatch({ control, name: ["type", "startDate", "endDate"] });
  const { isHalf, days } = getLeavePeriod(type, startDate, endDate);

  const close = () => {
    reset(createDefaultValues());
    createLeave.reset();
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    try {
      await createLeave.mutateAsync({
        type: values.type,
        startDate: values.startDate,
        // 반차는 시작일 하루
        endDate: getLeavePeriod(values.type, values.startDate, values.endDate).endDate,
        reason: values.reason,
      });
      close();
    } catch (error) {
      if (!setServerErrors(error, setError)) setError("root", { message: getErrorMessage(error) });
    }
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
          <Button type="submit" form="leave-request-form" disabled={createLeave.isPending}>
            {isManager ? "등록하기" : "신청하기"}
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
              {(id) => (
                <Input id={id} type="date" aria-invalid={!!errors.startDate} {...register("startDate")} />
              )}
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
              · 사용 가능 연차 <strong>{balance ? `${balance.available}일` : "-"}</strong>
            </>
          )}
          {!isAnnualType(type) && " · 연차에서 차감되지 않습니다."}
          <br />
          {isManager
            ? "매니저 휴가는 별도 승인 없이 신청 즉시 승인됩니다."
            : "소속 부서의 매니저가 승인합니다. 주말은 일수에서 빠집니다."}
        </Summary>
        {errors.root && <ErrorText role="alert">{errors.root.message}</ErrorText>}
      </form>
    </Modal>
  );
}
