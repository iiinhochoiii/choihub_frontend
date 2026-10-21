"use client";

import { useId } from "react";

interface Props {
  size?: number;
  /** inverted: 파란 배경 위에 놓을 때 쓰는 흰 바탕 + 파란 마크 */
  variant?: "default" | "inverted";
  title?: string;
}

/**
 * ChoiHub 로고 마크.
 * C 모양 고리가 두 사람(팀)을 감싸는 형태로, "ChoiHub 안에 모인 팀"을 표현한다.
 * 같은 모양을 app/icon.svg(파비콘)에서도 쓰므로 수정 시 함께 바꾼다.
 */
export function LogoMark({ size = 30, variant = "default", title }: Props) {
  const gradientId = useId();
  const inverted = variant === "inverted";
  const markColor = inverted ? "#3b5bdb" : "#ffffff";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4c6ef5" />
          <stop offset="1" stopColor="#3b5bdb" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={inverted ? "#ffffff" : `url(#${gradientId})`} />
      <path
        d="M24.2 9.4 A10.2 10.2 0 1 0 24.2 22.6"
        fill="none"
        stroke={markColor}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <g fill={markColor}>
        <circle cx="18.4" cy="12.4" r="2.5" opacity=".7" />
        <path d="M14.6 21c.4-2.6 2-4.2 3.8-4.2s3.4 1.6 3.8 4.2z" opacity=".7" />
        <circle cx="13.8" cy="13.4" r="2.9" />
        <path d="M8.8 22.2c.4-3 2.4-4.8 5-4.8s4.6 1.8 5 4.8z" />
      </g>
    </svg>
  );
}
