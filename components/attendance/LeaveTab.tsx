"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Button,
  ConfirmModal,
  MutedCell,
  StatusBadge,
  Table,
  TableWrap,
  TitleCell,
  Toolbar,
  Muted,
} from "@/components/ui";
import { formatDate } from "@/lib/date";
import { LEAVE_TYPES, REQUEST_STATUS } from "@/lib/labels";
import { getMemberName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { formatPeriod } from "./utils";

export function LeaveTab() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [modalOpen, setModalOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const requests = data.leaveRequests
    .filter((r) => r.memberId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const cancel = (id: string) => {
    update((prev) => ({
      ...prev,
      leaveRequests: prev.leaveRequests.filter((r) => r.id !== id),
    }));
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
                  {r.reviewerId && (
                    <Muted style={{ marginLeft: 6 }}>{getMemberName(data, r.reviewerId)}</Muted>
                  )}
                </td>
                <td style={{ textAlign: "right" }}>
                  {r.status === "pending" && (
                    <Button $size="sm" $variant="ghost" onClick={() => setCancelId(r.id)}>
                      신청 취소
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      <LeaveRequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <ConfirmModal
        open={cancelId !== null}
        title="휴가 신청 취소"
        message="승인 대기 중인 휴가 신청을 취소할까요?"
        confirmLabel="신청 취소"
        danger
        onConfirm={() => cancelId && cancel(cancelId)}
        onClose={() => setCancelId(null)}
      />
    </div>
  );
}
