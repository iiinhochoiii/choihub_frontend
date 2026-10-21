"use client";

import styled from "@emotion/styled";
import { transientOptions } from "@/components/ui";
import { formatDate } from "@/lib/date";
import { APPROVAL_STEP_STATUS } from "@/lib/labels";
import { getMember } from "@/lib/selectors";
import { useData } from "@/lib/store";
import type { ApprovalStep } from "@/lib/types";

const Line = styled.div`
  display: flex;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  width: fit-content;
  max-width: 100%;
`;

const Box = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 96px;
  text-align: center;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const BoxHead = styled.div`
  padding: 6px 4px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Stamp = styled("div", transientOptions)<{ $color: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;

  span {
    padding: 2px 8px;
    border: 2px solid ${({ $color }) => $color};
    border-radius: 6px;
    font-size: 12px;
    font-weight: 700;
    color: ${({ $color }) => $color};
  }
`;

const BoxFoot = styled.div`
  padding: 6px 4px;
  font-size: 12px;
  line-height: 1.4;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  strong {
    display: block;
    font-size: 13px;
  }

  small {
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

const stampColor = {
  drafted: "var(--color-primary)",
  approved: "var(--color-success)",
  rejected: "var(--color-danger)",
  pending: "var(--color-warning)",
  waiting: "var(--color-text-subtle)",
} as const;

interface ApprovalLineProps {
  drafterId: string;
  draftedAt?: string;
  steps: ApprovalStep[];
}

/** 결재란(도장 박스). 기안자 + 결재자 순서로 표시 */
export function ApprovalLine({ drafterId, draftedAt, steps }: ApprovalLineProps) {
  const { data } = useData();
  const drafter = getMember(data, drafterId);

  return (
    <Line>
      <Box>
        <BoxHead>기안</BoxHead>
        <Stamp $color={stampColor.drafted}>
          <span>기안</span>
        </Stamp>
        <BoxFoot>
          <strong>{drafter?.name ?? "알 수 없음"}</strong>
          <small>{draftedAt ? formatDate(draftedAt) : drafter?.position}</small>
        </BoxFoot>
      </Box>
      {steps.map((step, index) => {
        const member = getMember(data, step.approverId);
        return (
          <Box key={`${step.approverId}-${index}`}>
            <BoxHead>결재 {index + 1}</BoxHead>
            <Stamp $color={stampColor[step.status]}>
              <span>{APPROVAL_STEP_STATUS[step.status].label}</span>
            </Stamp>
            <BoxFoot>
              <strong>{member?.name ?? "알 수 없음"}</strong>
              <small>{step.actedAt ? formatDate(step.actedAt) : member?.position}</small>
            </BoxFoot>
          </Box>
        );
      })}
    </Line>
  );
}
