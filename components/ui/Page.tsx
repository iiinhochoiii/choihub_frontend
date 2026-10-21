"use client";

import styled from "@emotion/styled";
import { Inbox, Lock } from "lucide-react";
import { transientOptions } from "./Button";

const HeaderWrap = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 24px;

  h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  p {
    margin-top: 4px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <HeaderWrap>
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <Actions>{actions}</Actions>}
    </HeaderWrap>
  );
}

/** 세로 방향 간격 컨테이너 */
export const Stack = styled("div", transientOptions)<{ $gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ $gap = 16 }) => $gap}px;
  min-width: 0;
`;

/** 가로 방향 간격 컨테이너 */
export const Row = styled("div", transientOptions)<{
  $gap?: number;
  $justify?: "flex-start" | "center" | "space-between" | "flex-end";
  $wrap?: boolean;
}>`
  display: flex;
  align-items: center;
  flex-wrap: ${({ $wrap = true }) => ($wrap ? "wrap" : "nowrap")};
  justify-content: ${({ $justify = "flex-start" }) => $justify};
  gap: ${({ $gap = 8 }) => $gap}px;
  min-width: 0;
`;

/** 목록 상단 툴바 (필터 + 검색 + 버튼) */
export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSubtle};

  svg {
    width: 32px;
    height: 32px;
    margin-bottom: 4px;
  }

  strong {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 600;
  }
`;

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <EmptyWrap>
      {icon ?? <Inbox />}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </EmptyWrap>
  );
}

export function AccessDenied({ message }: { message?: string }) {
  return (
    <EmptyWrap style={{ padding: "80px 16px" }}>
      <Lock />
      <strong>접근 권한이 없습니다</strong>
      <p>{message ?? "이 메뉴는 매니저 권한이 있는 사용자만 이용할 수 있습니다."}</p>
    </EmptyWrap>
  );
}

/** 상단 안내 배너 */
export const Notice = styled("div", transientOptions)<{ $tone?: "info" | "warning" }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  margin-bottom: 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  background: ${({ theme, $tone = "info" }) =>
    $tone === "warning" ? theme.colors.warningSoft : theme.colors.infoSoft};
  color: ${({ theme, $tone = "info" }) =>
    $tone === "warning" ? theme.colors.warning : theme.colors.info};

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
`;

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
`;
