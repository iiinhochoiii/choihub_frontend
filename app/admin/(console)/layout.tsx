import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ShellLoading } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "운영 콘솔",
};

// 하위의 동적 세그먼트([id]) 때문에 Suspense 경계가 필요하다. (app/dashboard/layout.tsx 참고)
export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<ShellLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
