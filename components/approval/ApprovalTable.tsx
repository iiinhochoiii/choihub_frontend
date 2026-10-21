"use client";

import { useRouter } from "next/navigation";
import { EmptyState, MutedCell, StatusBadge, Table, TableWrap, TitleCell } from "@/components/ui";
import { getCurrentStep } from "@/lib/approval";
import { formatDate } from "@/lib/date";
import { APPROVAL_DOC_STATUS } from "@/lib/labels";
import { getMemberName } from "@/lib/selectors";
import { useData } from "@/lib/store";
import type { ApprovalDocument } from "@/lib/types";

export function ApprovalTable({ docs, emptyText }: { docs: ApprovalDocument[]; emptyText: string }) {
  const router = useRouter();
  const { data } = useData();

  if (docs.length === 0) {
    return (
      <TableWrap>
        <EmptyState title={emptyText} />
      </TableWrap>
    );
  }

  return (
    <TableWrap>
      <Table>
        <thead>
          <tr>
            <th>문서번호</th>
            <th>양식</th>
            <th>제목</th>
            <th>기안자</th>
            <th>기안일</th>
            <th>상태</th>
            <th>현재 결재자</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => {
            const current = getCurrentStep(doc);
            return (
              <tr
                key={doc.id}
                data-clickable="true"
                onClick={() => router.push(`/dashboard/approval/${doc.id}`)}
              >
                <MutedCell>{doc.docNumber}</MutedCell>
                <td>{doc.formName}</td>
                <TitleCell $maxWidth={320}>{doc.title}</TitleCell>
                <td>{getMemberName(data, doc.drafterId)}</td>
                <MutedCell>{formatDate(doc.createdAt)}</MutedCell>
                <td>
                  <StatusBadge value={APPROVAL_DOC_STATUS[doc.status]} />
                </td>
                <td>{current ? getMemberName(data, current.approverId) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableWrap>
  );
}
