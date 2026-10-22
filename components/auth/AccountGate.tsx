"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Button, Field, Input, Stack } from "@/components/ui";
import { setServerErrors } from "@/lib/form";
import { type InitialPasswordFormValues, initialPasswordSchema } from "@/lib/schemas/account";
import { useAuth, useChangeInitialPassword, useCurrentUser } from "@/queries/auth";

const Screen = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px 16px;
  background: ${({ theme }) => theme.colors.background};
`;

const Panel = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.md};

  > svg {
    width: 36px;
    height: 36px;
    margin-bottom: 16px;
    color: ${({ theme }) => theme.colors.primary};
  }

  h1 {
    font-size: 20px;
    font-weight: 800;
  }

  > p {
    margin: 8px 0 24px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ErrorText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

function useLogoutToLogin() {
  const router = useRouter();
  const { logout } = useAuth();
  return () => {
    logout();
    router.replace("/login");
  };
}

/** 운영자가 회사 이용을 정지한 경우 */
export function SuspendedScreen() {
  const logout = useLogoutToLogin();
  return (
    <Screen>
      <Panel>
        <Ban />
        <h1>이용이 정지된 회사입니다</h1>
        <p>
          소속 회사의 ChoiHub 이용이 정지되었습니다. 자세한 내용은 회사 담당자 또는 ChoiHub 운영팀에 문의하세요.
        </p>
        <Button $block $variant="secondary" onClick={logout}>
          로그아웃
        </Button>
      </Panel>
    </Screen>
  );
}

/** 초기 비밀번호로 발급된 계정은 서비스를 쓰기 전에 비밀번호를 바꿔야 한다. */
export function PasswordChangeScreen() {
  const user = useCurrentUser();
  // 성공하면 mustChangePassword가 풀린 사용자 정보를 다시 받아 셸이 업무 화면을 그린다.
  const change = useChangeInitialPassword();
  const logout = useLogoutToLogin();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<InitialPasswordFormValues>({
    resolver: zodResolver(initialPasswordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  // 초기 비밀번호와 같은지는 서버가 확인한다.
  const submit = handleSubmit((values) =>
    change.mutate(values, { onError: (error) => setServerErrors(error, setError) }),
  );

  const serverError = change.error && !Object.keys(errors).length ? getErrorMessage(change.error) : undefined;
  const error = errors.password?.message ?? errors.confirm?.message ?? serverError;

  return (
    <Screen>
      <Panel>
        <KeyRound />
        <h1>비밀번호를 변경해 주세요</h1>
        <p>{user.name}님, 처음 로그인하셨습니다. 안전을 위해 초기 비밀번호를 새 비밀번호로 바꾼 뒤 이용할 수 있습니다.</p>
        <form onSubmit={submit} noValidate>
          <Stack $gap={14}>
            <Field label="새 비밀번호" required hint="8자 이상">
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
              )}
            </Field>
            <Field label="새 비밀번호 확인" required>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirm}
                  {...register("confirm")}
                />
              )}
            </Field>
            {error && <ErrorText role="status">{error}</ErrorText>}
            <Button type="submit" $block disabled={change.isPending}>
              비밀번호 변경하고 시작하기
            </Button>
            <Button $block $variant="ghost" onClick={logout}>
              나중에 하기 (로그아웃)
            </Button>
          </Stack>
        </form>
      </Panel>
    </Screen>
  );
}
