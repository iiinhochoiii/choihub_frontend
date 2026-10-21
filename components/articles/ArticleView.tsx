"use client";

import styled from "@emotion/styled";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ButtonLink, EmptyState } from "@/components/ui";

export const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

export function BackToList({ href, label }: { href: string; label: string }) {
  return (
    <BackLink href={href}>
      <ArrowLeft />
      {label}
    </BackLink>
  );
}

export const ArticleHeader = styled.div`
  padding-bottom: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  h1 {
    margin: 10px 0 12px;
    font-size: 20px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: -0.02em;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
`;

export const ArticleMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const ArticleBody = styled.div`
  min-height: 160px;
  font-size: 15px;
  line-height: 1.8;
  white-space: pre-line;
  overflow-wrap: anywhere;
`;

export const ArticleActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const NavList = styled.ul`
  margin-top: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;

  li + li {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  a,
  span {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    font-size: 14px;
    min-width: 0;
  }

  a:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  em {
    flex-shrink: 0;
    width: 48px;
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  strong {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

interface AdjacentItem {
  id: string;
  title: string;
}

/** 이전/다음 글 링크 */
export function AdjacentNav({
  basePath,
  prev,
  next,
}: {
  basePath: string;
  prev?: AdjacentItem;
  next?: AdjacentItem;
}) {
  const row = (label: string, item?: AdjacentItem) => (
    <li>
      {item ? (
        <Link href={`${basePath}/${item.id}`}>
          <em>{label}</em>
          <strong>{item.title}</strong>
          <ChevronRight />
        </Link>
      ) : (
        <span>
          <em>{label}</em>
          {label} 글이 없습니다.
        </span>
      )}
    </li>
  );

  return (
    <NavList>
      {row("이전글", prev)}
      {row("다음글", next)}
    </NavList>
  );
}

export function NotFoundArticle({ listHref, label }: { listHref: string; label: string }) {
  return (
    <EmptyState
      title="게시글을 찾을 수 없습니다"
      description="삭제되었거나 존재하지 않는 글입니다."
      action={
        <ButtonLink href={listHref} $variant="secondary" $size="sm" style={{ marginTop: 8 }}>
          {label}
        </ButtonLink>
      }
    />
  );
}

/**
 * 상세 진입 시 조회수를 한 번만 올린다.
 * StrictMode의 effect 이중 실행에도 ref가 유지되므로 같은 id는 다시 세지 않는다.
 */
export function useCountViewOnce(id: string | undefined, exists: boolean, increment: (id: string) => void) {
  const countedId = useRef<string | null>(null);
  useEffect(() => {
    if (!id || !exists || countedId.current === id) return;
    countedId.current = id;
    increment(id);
  }, [id, exists, increment]);
}
