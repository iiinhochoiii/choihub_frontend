"use client";

import styled from "@emotion/styled";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/common/LogoMark";
import { Button, Field, Input } from "@/components/ui";
import { DEMO_OPERATOR } from "@/lib/platform";
import { useOperatorAuth } from "@/lib/store";

const Screen = styled.main`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px 16px;
  background: #111827;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 32px 28px;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
  font-size: 18px;
  font-weight: 800;

  small {
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 11px;
    background: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ErrorText = styled.p`
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  background: ${({ theme }) => theme.colors.dangerSoft};
  color: ${({ theme }) => theme.colors.danger};
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export function AdminLoginForm() {
  const router = useRouter();
  const { ready, operator, login } = useOperatorAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && operator) router.replace("/admin");
  }, [ready, operator, router]);

  const submit = (nextEmail: string, nextPassword: string) => {
    const result = login(nextEmail, nextPassword);
    if (!result.ok) return setError(result.message);
    router.replace("/admin");
  };

  return (
    <Screen>
      <Panel>
        <Brand>
          <LogoMark size={30} />
          ChoiHub <small>운영 콘솔</small>
        </Brand>
        <Form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            submit(email, password);
          }}
        >
          <Field label="운영자 이메일">
            {(id) => (
              <Input
                id={id}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
              />
            )}
          </Field>
          <Field label="비밀번호">
            {(id) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
            )}
          </Field>
          {error && <ErrorText role="status">{error}</ErrorText>}
          <Button type="submit" $size="lg" $block disabled={!ready}>
            로그인
          </Button>
          <Button
            $variant="secondary"
            $block
            disabled={!ready}
            onClick={() => {
              setEmail(DEMO_OPERATOR.email);
              setPassword(DEMO_OPERATOR.password);
              submit(DEMO_OPERATOR.email, DEMO_OPERATOR.password);
            }}
          >
            <ShieldCheck />
            데모 운영자로 로그인
          </Button>
        </Form>
        <Footer>
          <Link href="/login">
            <ArrowLeft />
            구성원 로그인
          </Link>
          <span>{DEMO_OPERATOR.email}</span>
        </Footer>
      </Panel>
    </Screen>
  );
}
