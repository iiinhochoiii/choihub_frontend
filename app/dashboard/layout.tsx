import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardShell, ShellLoading } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "대시보드",
};

// 하위에 동적 세그먼트([id])가 있어 usePathname/useParams가 요청 시점에 결정되므로
// cacheComponents 환경에서는 Suspense 경계가 필요하다.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
