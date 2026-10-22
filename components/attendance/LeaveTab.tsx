"use client";

import styled from "@emotion/styled";
import { Plus } from "lucide-react";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  Button,
  ConfirmModal,
  ErrorState,
  LoadingState,
  MutedCell,
  StatusBadge,
  Table,
  TableWrap,
  TitleCell,
  Toolbar,
  Muted,
} from "@/components/ui";
import { formatDate, todayKey } from "@/lib/date";
import { LEAVE_TYPES, REQUEST_STATUS } from "@/lib/labels";
import { useCancelLeave, useMyLeaveRequests } from "@/queries/attendance";
import { useDirectory } from "@/queries/directory";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { formatPeriod } from "./utils";

const ErrorText = styled.p`
  margin-bottom: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

export function LeaveTab() {
  const { getMemberName } = useDirectory();
  const { data, isPending, error, refetch } = useMyLeaveRequests();
  const cancelLeave = useCancelLeave();
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // 서버가 신청일 내림차순으로 준다.
  const requests = data ?? [];
  const today = todayKey();
  const cancelTarget = requests.find((r) => r.id === cancelId);

  const cancel = (id: string) => {
    cancelLeave.mutate(id);
  };

  return (
    <div>
      <Toolbar>
        <Muted>총 {requests.length}건</Muted>
        <Button onClick={() => setModalOpen(true)}>
          <Plus />
          휴가 신청
        </Button>
      </Toolbar>

      {cancelLeave.error && <ErrorText role="alert">{getErrorMessage(cancelLeave.error)}</ErrorText>}

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>유형</th>
                <th>기간</th>
                <th>일수</th>
                <th>사유</th>
                <th>신청일</th>
                <th>상태</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <MutedCell colSpan={7} style={{ textAlign: "center", padding: 32 }}>
                    신청한 휴가가 없습니다.
                  </MutedCell>
                </tr>
              )}
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{LEAVE_TYPES[r.type].label}</td>
                  <td>{formatPeriod(r.startDate, r.endDate)}</td>
                  <td>{r.days}일</td>
                  <TitleCell $maxWidth={240}>{r.reason}</TitleCell>
                  <MutedCell>{formatDate(r.createdAt)}</MutedCell>
                  <td>
                    <StatusBadge value={REQUEST_STATUS[r.status]} />
                    {r.autoApproved ? (
                      <Muted style={{ marginLeft: 6 }}>자동 승인</Muted>
                    ) : (
                      r.reviewerId && <Muted style={{ marginLeft: 6 }}>{getMemberName(r.reviewerId)}</Muted>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {/* 대기 중인 신청, 또는 시작 전인 자동 승인 휴가(매니저 본인)만 취소할 수 있다. 서버도 같은 규칙으로 막는다. */}
                    {(r.status === "pending" || (r.autoApproved && r.startDate > today)) && (
                      <Button
                        $size="sm"
                        $variant="ghost"
                        disabled={cancelLeave.isPending}
                        onClick={() => {
                          cancelLeave.reset();
                          setCancelId(r.id);
                        }}
                      >
                        {r.status === "pending" ? "신청 취소" : "휴가 취소"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}

      <LeaveRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmModal
        open={cancelId !== null}
        title={cancelTarget?.autoApproved ? "휴가 취소" : "휴가 신청 취소"}
        message={
          cancelTarget?.autoApproved ? "승인된 휴가를 취소할까요?" : "승인 대기 중인 휴가 신청을 취소할까요?"
        }
        confirmLabel={cancelTarget?.autoApproved ? "휴가 취소" : "신청 취소"}
        danger
        onConfirm={() => cancelId && cancel(cancelId)}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
