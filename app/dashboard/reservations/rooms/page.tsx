"use client";

import { RoomManager } from "@/components/reservations/RoomManager";
import { AccessDenied, PageHeader } from "@/components/ui";
import { useCurrentUser } from "@/lib/store";

export default function RoomManagementPage() {
  const user = useCurrentUser();

  if (!user.isManager) {
    return (
      <>
        <PageHeader title="회의실 관리" />
        <AccessDenied message="회의실 추가·수정·삭제는 매니저 권한이 있는 사용자만 할 수 있습니다." />
      </>
    );
  }

  return <RoomManager />;
}
