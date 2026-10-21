"use client";

import { Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { ApprovalTable } from "@/components/approval/ApprovalTable";
import { ButtonLink, PageHeader, Stack, Tabs, type TabItem } from "@/components/ui";
import { isMyTurn } from "@/lib/approval";
import { useCurrentUser, useData } from "@/lib/store";

type TabValue = "pending" | "drafted" | "processed" | "all";

export default function ApprovalPage() {
  const { data } = useData();
  const user = useCurrentUser();
  const [tab, setTab] = useState<TabValue>("pending");

  const docs = [...data.approvalDocs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const groups: Record<TabValue, typeof docs> = {
    pending: docs.filter((d) => isMyTurn(d, user.id)),
    drafted: docs.filter((d) => d.drafterId === user.id),
    processed: docs.filter((d) =>
      d.steps.some(
        (s) => s.approverId === user.id && (s.status === "approved" || s.status === "rejected"),
      ),
    ),
    all: docs,
  };

  const tabs: TabItem<TabValue>[] = [
    { value: "pending", label: "결재 대기", count: groups.pending.length },
    { value: "drafted", label: "기안 문서", count: groups.drafted.length },
    { value: "processed", label: "결재 내역", count: groups.processed.length },
    ...(user.isManager ? [{ value: "all" as const, label: "전체 문서", count: groups.all.length }] : []),
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
        <ApprovalTable docs={groups[tab]} emptyText={emptyText[tab]} />
      </Stack>
    </>
  );
}
