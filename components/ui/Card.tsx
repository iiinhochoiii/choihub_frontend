"use client";

import styled from "@emotion/styled";
import { transientOptions } from "./Button";

export const Card = styled("section", transientOptions)<{ $padding?: number }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  padding: ${({ $padding = 20 }) => $padding}px;
  min-width: 0;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export const CardLink = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;
