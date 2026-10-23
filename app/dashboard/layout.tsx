import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardShell, ShellLoading } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "대시보드",
};

// DashboardShell이 클라이언트에서 로그인을 확인한 뒤에야 하위 페이지를 그리므로
// 프리렌더 시점에는 하위 세그먼트가 렌더되지 않는다.
// `instant = false`는 이 layout만 제외하고 하위 page는 계속 검증하므로, 하위 트리 전체의 dev 검증을 끈다.
export const instant = { unstable_disableDevValidation: true };

// 하위에 동적 세그먼트([id])가 있어 usePathname/useParams가 요청 시점에 결정되므로
// cacheComponents 환경에서는 Suspense 경계가 필요하다.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
