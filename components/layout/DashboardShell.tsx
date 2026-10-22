"use client";

import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDirectoryStatus } from "@/queries/directory";
import { getErrorMessage } from "@/apis/defaultInstance";
import { PasswordChangeScreen, SuspendedScreen } from "@/components/auth/AccountGate";
import { ErrorState } from "@/components/ui";
import { useAuth } from "@/queries/auth";
import { mq } from "@/styles/theme";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  ${mq.lg} {
    padding-left: ${({ theme }) => theme.layout.sidebarWidth};
  }
`;

const Content = styled.main`
  flex: 1;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 24px 16px 48px;

  ${mq.md} {
    padding: 32px 32px 64px;
  }
`;

export const ShellLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  color: ${({ theme }) => theme.colors.textSubtle};

  &::before {
    content: "";
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid ${({ theme }) => theme.colors.border};
    border-top-color: ${({ theme }) => theme.colors.primary};
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/** 로그인 가드 + 사이드바/상단바 레이아웃 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, error, retry, user, tenant } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  // 정지된 회사나 비밀번호 변경 전 계정은 업무 API를 쓸 수 없으므로 그때는 불러오지 않는다.
  const usable = !!user && tenant?.status === "active" && !user.mustChangePassword;
  const directory = useDirectoryStatus(usable);

  useEffect(() => {
    if (ready && !error && !user) router.replace("/login");
  }, [ready, error, user, router]);

  if (ready && error) {
    return <ErrorState message={getErrorMessage(error)} onRetry={retry} />;
  }
  if (!ready || !user || !tenant) return <ShellLoading aria-label="불러오는 중" />;
  if (tenant.status === "suspended") return <SuspendedScreen />;
  if (user.mustChangePassword) return <PasswordChangeScreen />;
  if (directory.error) return <ErrorState message={getErrorMessage(directory.error)} onRetry={directory.refetch} />;
  // 구성원·부서·회사정보를 먼저 불러와 하위 화면이 바로 쓸 수 있게 한다(apis/queries/directory).
  if (!directory.ready) return <ShellLoading aria-label="불러오는 중" />;

  return (
    <>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <Body>
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <Content>{children}</Content>
      </Body>
    </>
  );
}
