"use client";

import { useState } from "react";
import { LeaveTab } from "@/components/attendance/LeaveTab";
import { RecordsTab } from "@/components/attendance/RecordsTab";
import { SummaryCards } from "@/components/attendance/SummaryCards";
import { TeamTab } from "@/components/attendance/TeamTab";
import { TodayCard } from "@/components/attendance/TodayCard";
import { PageHeader, Stack, Tabs, type TabItem } from "@/components/ui";
import { useCurrentUser, useData } from "@/lib/store";

type TabValue = "records" | "leave" | "team";

export default function AttendancePage() {
  const { data } = useData();
  const user = useCurrentUser();
  const [tab, setTab] = useState<TabValue>("records");

  const pendingCount = data.leaveRequests.filter((r) => r.status === "pending").length;
  const tabs: TabItem<TabValue>[] = [
    { value: "records", label: "출퇴근 기록" },
    { value: "leave", label: "휴가 신청 내역" },
    ...(user.isManager ? [{ value: "team" as const, label: "팀 근태 관리", count: pendingCount }] : []),
  ];

  return (
    <>
      <PageHeader title="근태관리" description="출퇴근을 기록하고 근무 현황과 남은 연차를 확인합니다." />
      <Stack $gap={20}>
        <TodayCard />
        <SummaryCards />
        <Tabs items={tabs} value={tab} onChange={setTab} />
        {tab === "records" && <RecordsTab />}
        {tab === "leave" && <LeaveTab />}
        {tab === "team" && user.isManager && <TeamTab />}
      </Stack>
    </>
  );
}
