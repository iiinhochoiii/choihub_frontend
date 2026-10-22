"use client";

import { Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { ApprovalTable } from "@/components/approval/ApprovalTable";
import { ButtonLink, ErrorState, LoadingState, PageHeader, Stack, Tabs, TableWrap, type TabItem } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { useApprovalDocs, useApprovalPendingCount } from "@/queries/approval";
import { useCurrentUser } from "@/queries/auth";
import type { ApprovalBox } from "@/types";

type TabValue = ApprovalBox;

export default function ApprovalPage() {
  const user = useCurrentUser();
  const [tab, setTab] = useState<TabValue>("pending");
  // 서버가 탭(box)별로 걸러 최신순으로 돌려준다.
  const { data: docs, isPending, error, refetch } = useApprovalDocs(tab);
  const { data: pendingCount } = useApprovalPendingCount();

  // 건수는 결재 대기만 서버가 따로 알려 준다. 나머지 탭은 건수 없이 표시한다.
  const tabs: TabItem<TabValue>[] = [
    { value: "pending", label: "결재 대기", count: pendingCount },
    { value: "drafted", label: "기안 문서" },
    { value: "processed", label: "결재 내역" },
    ...(user.isManager ? [{ value: "all" as const, label: "전체 문서" }] : []),
  ];

  const emptyText: Record<TabValue, string> = {
    pending: "결재할 문서가 없습니다.",
    drafted: "기안한 문서가 없습니다.",
    processed: "처리한 결재 내역이 없습니다.",
    all: "등록된 문서가 없습니다.",
  };

  return (
    <>
      <PageHeader
        title="전자결재"
        description="양식을 선택해 문서를 기안하고 결재를 진행합니다."
        actions={
          <>
            {user.isManager && (
              <ButtonLink href="/dashboard/approval/forms" $variant="secondary">
                <Settings2 />
                양식 관리
              </ButtonLink>
            )}
            <ButtonLink href="/dashboard/approval/new">
              <Plus />새 결재 작성
            </ButtonLink>
          </>
        }
      />
      <Stack $gap={16}>
        <Tabs items={tabs} value={tab} onChange={setTab} />
        {isPending ? (
          <TableWrap>
            <LoadingState />
          </TableWrap>
        ) : error ? (
          <TableWrap>
            <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
          </TableWrap>
        ) : (
          <ApprovalTable docs={docs} emptyText={emptyText[tab]} />
        )}
      </Stack>
    </>
  );
}
