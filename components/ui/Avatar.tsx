"use client";

import styled from "@emotion/styled";
import { transientOptions } from "./Button";

const Circle = styled("span", transientOptions)<{ $size: number; $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  color: #fff;
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

interface AvatarProps {
  name: string;
  color?: string;
  size?: number;
}

/** 사람 이름이 아닌 표시명(데모 계정 등)은 앞 글자 하나만 보여 준다. */
const ROLE_DISPLAY_NAMES = new Set(["매니저", "방문자"]);

/** 한글 이름은 마지막 두 글자(예: 홍길동 → 길동), 역할 표시명은 첫 글자로 이니셜을 만든다. */
export function getInitials(name: string): string {
  if (ROLE_DISPLAY_NAMES.has(name)) return name.slice(0, 1);
  return name.length > 2 ? name.slice(-2) : name;
}

export function Avatar({ name, color = "#98a2b3", size = 32 }: AvatarProps) {
  const initials = getInitials(name);
  return (
    <Circle $size={size} $color={color} aria-hidden>
      {initials}
    </Circle>
  );
}

const PersonWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  strong {
    font-weight: 600;
  }

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** 아바타 + 이름 (+ 보조 텍스트) */
export function Person({
  name,
  color,
  caption,
  size = 28,
}: AvatarProps & { caption?: string }) {
  return (
    <PersonWrap>
      <Avatar name={name} color={color} size={size} />
      <span>
        <strong>{name}</strong>
        {caption && <small>{caption}</small>}
      </span>
    </PersonWrap>
  );
}
