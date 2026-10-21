"use client";

import styled from "@emotion/styled";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui";

export const PAGE_SIZE = 10;

const Wrap = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 20px;
`;

const PageButton = styled.button`
  min-width: 34px;
  height: 34px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &[aria-current="page"] {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
  }
`;

interface PaginationProps {
  page: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, total, pageSize = PAGE_SIZE, onChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  return (
    <Wrap aria-label="페이지 이동">
      <IconButton aria-label="이전 페이지" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft />
      </IconButton>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <PageButton
          key={p}
          type="button"
          aria-current={p === page ? "page" : undefined}
          onClick={() => onChange(p)}
        >
          {p}
        </PageButton>
      ))}
      <IconButton aria-label="다음 페이지" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        <ChevronRight />
      </IconButton>
    </Wrap>
  );
}

/** 현재 페이지 항목만 잘라낸다. 범위를 벗어난 페이지는 마지막 페이지로 보정한다. */
export function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    page: current,
    items: items.slice((current - 1) * pageSize, current * pageSize),
  };
}
