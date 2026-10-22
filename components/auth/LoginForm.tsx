"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LogIn, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { LogoMark } from "@/components/common/LogoMark";
import { Button, Field, Input } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { type LoginFormValues, loginSchema } from "@/lib/schemas/auth";
import { useAuth, useLoginMutation } from "@/queries/auth";
import { mq } from "@/styles/theme";

const Wrap = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;

  ${mq.lg} {
    grid-template-columns: 1fr 1fr;
  }
`;

const Aside = styled.aside`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  background: linear-gradient(160deg, #3b5bdb, #1c2a6b);
  color: #fff;

  ${mq.lg} {
    display: flex;
  }

  h2 {
    font-size: 34px;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  p {
    margin-top: 16px;
    font-size: 16px;
    line-height: 1.7;
    opacity: 0.8;
  }
`;

const Brand = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 800;
`;

const Main = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  background: ${({ theme }) => theme.colors.surface};
`;

const Panel = styled.div`
  width: 100%;
  max-width: 400px;
`;

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 32px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const Sub = styled.p`
  margin: 8px 0 28px;
  color: ${({ theme }) => theme.colors.textMuted};
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

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 28px 0 16px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSubtle};

  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`;

const DemoList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const DemoButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  text-align: left;
  transition:
    border-color 0.15s,
    background-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySoft};
  }

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.primary};
  }

  strong {
    font-size: 14px;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const OperatorLink = styled(Link)`
  display: block;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

/** 백엔드 시드(npm run seed)로 만들어지는 데모 계정 */
const DEMO_ACCOUNTS = [
  { role: "manager", buttonLabel: "매니저로 로그인", description: "매니저 · 경영지원본부", email: "admin@testcompany.example" },
  { role: "employee", buttonLabel: "직원으로 로그인", description: "방문자 · 프론트엔드팀", email: "user@testcompany.example" },
] as const;
const DEMO_PASSWORD = "password";

export function LoginForm() {
  const router = useRouter();
  const { ready, user } = useAuth();
  const login = useLoginMutation();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  const submit = handleSubmit((values) =>
    login.mutate(values, { onSuccess: () => router.replace("/dashboard") }),
  );

  const error = errors.email?.message ?? errors.password?.message ?? (login.error && getErrorMessage(login.error));
  const disabled = !ready || login.isPending;

  return (
    <Wrap>
      <Aside>
        <Brand href="/">
          <LogoMark size={34} variant="inverted" />
          ChoiHub
        </Brand>
        <div>
          <h2>
            오늘의 업무를
            <br />
            한 화면에서 시작하세요
          </h2>
          <p>출근 기록부터 결재, 일정, 공지 확인까지 ChoiHub 하나로 충분합니다.</p>
        </div>
        <small style={{ opacity: 0.6 }}>© ChoiHub</small>
      </Aside>

      <Main>
        <Panel>
          <Back href="/">
            <ArrowLeft />
            서비스 소개로 돌아가기
          </Back>
          <Title>로그인</Title>
          <Sub>회사에서 발급받은 계정으로 로그인하세요.</Sub>

          <Form onSubmit={submit} noValidate>
            <Field label="이메일">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="username"
                  placeholder="name@company.com"
                  aria-invalid={!!errors.email}
                  {...register("email", { onChange: () => login.reset() })}
                />
              )}
            </Field>
            <Field label="비밀번호">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  aria-invalid={!!errors.password}
                  {...register("password", { onChange: () => login.reset() })}
                />
              )}
            </Field>
            {error && <ErrorText role="alert">{error}</ErrorText>}
            <Button type="submit" $size="lg" $block disabled={disabled}>
              <LogIn />
              로그인
            </Button>
          </Form>

          <Divider>데모 계정으로 체험하기</Divider>
          <DemoList>
            {DEMO_ACCOUNTS.map((account) => (
              <DemoButton
                key={account.email}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setValue("email", account.email);
                  setValue("password", DEMO_PASSWORD);
                  void submit();
                }}
              >
                {account.role === "manager" ? <ShieldCheck /> : <UserRound />}
                <strong>{account.buttonLabel}</strong>
                <small>{account.description}</small>
              </DemoButton>
            ))}
          </DemoList>
          <OperatorLink href="/admin/login">ChoiHub 운영자이신가요? 운영 콘솔 로그인 →</OperatorLink>
        </Panel>
      </Main>
    </Wrap>
  );
}
