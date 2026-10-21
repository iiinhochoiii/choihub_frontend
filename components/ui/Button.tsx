"use client";

import { css, type Theme } from "@emotion/react";
import styled from "@emotion/styled";
import Link from "next/link";
import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonStyleProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
  $block?: boolean;
}

/** `$` 접두사 prop과 emotion의 `as`는 DOM/하위 컴포넌트로 전달하지 않는다. */
export const transientOptions = {
  shouldForwardProp: (prop: string) => prop !== "as" && !prop.startsWith("$"),
};

const sizes: Record<ButtonSize, string> = {
  sm: "height: 32px; padding: 0 12px; font-size: 13px;",
  md: "height: 38px; padding: 0 16px; font-size: 14px;",
  lg: "height: 46px; padding: 0 22px; font-size: 15px;",
};

const variants = (theme: Theme): Record<ButtonVariant, string> => ({
  primary: `
    background: ${theme.colors.primary};
    color: ${theme.colors.onPrimary};
    &:hover:not(:disabled) { background: ${theme.colors.primaryHover}; }
  `,
  secondary: `
    background: ${theme.colors.surface};
    color: ${theme.colors.text};
    border-color: ${theme.colors.border};
    &:hover:not(:disabled) { background: ${theme.colors.surfaceHover}; }
  `,
  ghost: `
    background: transparent;
    color: ${theme.colors.textMuted};
    &:hover:not(:disabled) { background: ${theme.colors.surfaceHover}; color: ${theme.colors.text}; }
  `,
  danger: `
    background: ${theme.colors.danger};
    color: #fff;
    &:hover:not(:disabled) { filter: brightness(0.94); }
  `,
});

const buttonStyles = ({
  theme,
  $variant = "primary",
  $size = "md",
  $block,
}: ButtonStyleProps & { theme: Theme }) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  width: ${$block ? "100%" : "auto"};
  border: 1px solid transparent;
  border-radius: ${theme.radii.md};
  font-weight: 600;
  white-space: nowrap;
  transition:
    background-color 0.15s,
    color 0.15s,
    filter 0.15s;
  ${sizes[$size]}
  ${variants(theme)[$variant]}

  &:disabled {
    opacity: 0.5;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StyledButton = styled("button", transientOptions)<ButtonStyleProps>`
  ${buttonStyles}
`;

/** type 기본값을 "button"으로 둬서 폼 안에서 의도치 않은 submit을 막는다. */
export function Button({ type = "button", ...props }: ComponentProps<typeof StyledButton>) {
  return <StyledButton type={type} {...props} />;
}

export const ButtonLink = styled(Link, transientOptions)<ButtonStyleProps>`
  ${buttonStyles}
`;

const StyledIconButton = styled("button", transientOptions)<{ $size?: number }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size = 34 }) => $size}px;
  height: ${({ $size = 34 }) => $size}px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};
  transition: background-color 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &:disabled {
    opacity: 0.4;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export function IconButton({ type = "button", ...props }: ComponentProps<typeof StyledIconButton>) {
  return <StyledIconButton type={type} {...props} />;
}
