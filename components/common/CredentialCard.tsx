"use client";

import styled from "@emotion/styled";
import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { IconButton } from "@/components/ui";

const Box = styled.div`
  padding: 16px;
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
`;

const Title = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-weight: 700;

  svg {
    width: 16px;
    height: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Line = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 36px;

  dt {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: 14px;
    word-break: break-all;
  }
`;

const Caption = styled.p`
  margin-top: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <IconButton
      $size={30}
      aria-label={`${label} 복사`}
      title="복사"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // 클립보드 권한이 없으면 사용자가 직접 복사한다.
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
    </IconButton>
  );
}

interface Props {
  title?: string;
  loginUrl?: string;
  email: string;
  password: string;
}

/** 발급한 계정의 로그인 정보. 이 화면을 닫으면 초기 비밀번호를 다시 볼 수 없다. */
export function CredentialCard({ title = "로그인 정보", loginUrl, email, password }: Props) {
  const rows = [
    ...(loginUrl ? [{ label: "접속 주소", value: loginUrl }] : []),
    { label: "아이디", value: email },
    { label: "초기 비밀번호", value: password },
  ];
  return (
    <Box>
      <Title>
        <KeyRound />
        {title}
      </Title>
      <dl>
        {rows.map((row) => (
          <Line key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <CopyButton value={row.value} label={row.label} />
          </Line>
        ))}
      </dl>
      <Caption>창을 닫으면 초기 비밀번호를 다시 확인할 수 없습니다. 첫 로그인 시 비밀번호 변경을 요구합니다.</Caption>
    </Box>
  );
}
