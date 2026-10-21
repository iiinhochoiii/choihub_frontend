"use client";

import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PasswordChangeScreen, SuspendedScreen } from "@/components/auth/AccountGate";
import { useAuth } from "@/lib/store";
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
  const { ready, user, tenant } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user || !tenant) return <ShellLoading aria-label="불러오는 중" />;
  if (tenant.status === "suspended") return <SuspendedScreen />;
  if (user.mustChangePassword) return <PasswordChangeScreen />;

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
