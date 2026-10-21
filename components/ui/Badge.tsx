"use client";

import type { Theme } from "@emotion/react";
import styled from "@emotion/styled";
import type { Tone } from "@/lib/labels";
import { transientOptions } from "./Button";

const toneColors = (theme: Theme, tone: Tone) => {
  switch (tone) {
    case "primary":
      return [theme.colors.primarySoft, theme.colors.primary];
    case "success":
      return [theme.colors.successSoft, theme.colors.success];
    case "warning":
      return [theme.colors.warningSoft, theme.colors.warning];
    case "danger":
      return [theme.colors.dangerSoft, theme.colors.danger];
    case "info":
      return [theme.colors.infoSoft, theme.colors.info];
    default:
      return [theme.colors.surfaceHover, theme.colors.textMuted];
  }
};

export const Badge = styled("span", transientOptions)<{ $tone?: Tone }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ theme, $tone = "neutral" }) => toneColors(theme, $tone)[0]};
  color: ${({ theme, $tone = "neutral" }) => toneColors(theme, $tone)[1]};

  svg {
    width: 12px;
    height: 12px;
  }
`;

/** labels.ts의 { label, tone } 객체를 그대로 넘길 때 사용 */
export function StatusBadge({ value }: { value: { label: string; tone: Tone } }) {
  return <Badge $tone={value.tone}>{value.label}</Badge>;
}

export const Dot = styled("span", transientOptions)<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $color }) => $color};
`;
