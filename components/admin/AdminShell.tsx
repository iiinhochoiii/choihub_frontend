"use client";

import styled from "@emotion/styled";
import { Building2, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogoMark } from "@/components/common/LogoMark";
import { ShellLoading } from "@/components/layout/DashboardShell";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Button, ErrorState } from "@/components/ui";
import { useOperatorAuth } from "@/queries/auth";
import { mq } from "@/styles/theme";

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  background: #111827;
  color: #f9fafb;
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  height: ${({ theme }) => theme.layout.topbarHeight};
  margin: 0 auto;
  padding: 0 16px;

  ${mq.md} {
    padding: 0 32px;
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;

  small {
    display: none;
    margin-left: 4px;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.12);

    ${mq.sm} {
      display: inline;
    }
  }
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 600;
  color: rgba(249, 250, 251, 0.7);

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover,
  &[aria-current="page"] {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  font-size: 13px;

  span {
    display: none;
    opacity: 0.8;

    ${mq.md} {
      display: inline;
    }
  }
`;

const LogoutButton = styled(Button)`
  color: #f9fafb;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

const Content = styled.main`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  margin: 0 auto;
  padding: 24px 16px 64px;

  ${mq.md} {
    padding: 32px 32px 64px;
  }
`;

/** 운영자 로그인 가드 + 콘솔 레이아웃 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, error, retry, operator, logout } = useOperatorAuth();

  useEffect(() => {
    if (ready && !error && !operator) router.replace("/admin/login");
  }, [ready, error, operator, router]);

  if (ready && error) return <ErrorState message={getErrorMessage(error)} onRetry={retry} />;
  if (!ready || !operator) return <ShellLoading aria-label="불러오는 중" />;

  return (
    <>
      <Header>
        <HeaderInner>
          <Brand href="/admin">
            <LogoMark size={28} />
            ChoiHub
            <small>운영 콘솔</small>
          </Brand>
          <nav>
            <NavLink href="/admin" aria-current={pathname.startsWith("/admin") ? "page" : undefined}>
              <Building2 />
              회사 관리
            </NavLink>
          </nav>
          <Right>
            <span>{operator.name}</span>
            <LogoutButton
              $variant="ghost"
              $size="sm"
              onClick={() => {
                logout();
                router.replace("/admin/login");
              }}
            >
              <LogOut />
              로그아웃
            </LogoutButton>
          </Right>
        </HeaderInner>
      </Header>
      <Content>{children}</Content>
    </>
  );
}
