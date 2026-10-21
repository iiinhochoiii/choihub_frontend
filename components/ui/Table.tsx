"use client";

import styled from "@emotion/styled";
import { transientOptions } from "./Button";

/** 좁은 화면에서는 가로 스크롤 */
export const TableWrap = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`;

export const Table = styled.table`
  min-width: 640px;
  font-size: 14px;

  th,
  td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    white-space: nowrap;
  }

  th {
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textMuted};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  tbody tr:last-of-type td {
    border-bottom: none;
  }

  tbody tr[data-clickable="true"] {
    cursor: pointer;
  }

  tbody tr[data-clickable="true"]:hover td {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

/** 말줄임이 필요한 넓은 셀 (제목 등) */
export const TitleCell = styled("td", transientOptions)<{ $maxWidth?: number }>`
  max-width: ${({ $maxWidth = 420 }) => $maxWidth}px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

export const MutedCell = styled.td`
  color: ${({ theme }) => theme.colors.textMuted};
`;
