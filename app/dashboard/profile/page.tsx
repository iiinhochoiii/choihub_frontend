"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, RotateCcw, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  ConfirmModal,
  Field,
  FormGrid,
  Input,
  PageHeader,
  Select,
  Stack,
} from "@/components/ui";
import { getUsedLeaveDays } from "@/lib/attendance";
import { formatDate } from "@/lib/date";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import {
  type PasswordChangeFormValues,
  passwordChangeSchema,
  type ProfileFormValues,
  profileSchema,
} from "@/lib/schemas/account";
import { getDepartmentName } from "@/lib/selectors";
import { useAuth, useCurrentUser, useData } from "@/lib/store";
import type { MemberStatus } from "@/lib/types";
import { mq } from "@/styles/theme";

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${mq.lg} {
    grid-template-columns: 320px minmax(0, 1fr);
    align-items: start;
  }
`;

const ProfileCard = styled(Card)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;

  h2 {
    margin-top: 8px;
    font-size: 20px;
    font-weight: 800;
  }

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const InfoList = styled.dl`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 16px;
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  text-align: left;
  font-size: 13px;

  dt {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dd {
    font-weight: 500;
    text-align: right;
    word-break: break-all;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
`;

const Feedback = styled.span<{ error?: boolean }>`
  font-size: 13px;
  color: ${({ theme, error }) => (error ? theme.colors.danger : theme.colors.success)};
`;

export default function ProfilePage() {
  const router = useRouter();
  // RHF의 reset과 구분하기 위해 데이터 초기화는 resetData로 받는다.
  const { data, update, reset: resetData } = useData();
  const { logout } = useAuth();
  const user = useCurrentUser();

  const infoForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: user.phone, extension: user.extension, status: user.status },
  });
  const [infoSaved, setInfoSaved] = useState(false);

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", nextPassword: "", confirmPassword: "" },
  });
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);

  const usedLeave = getUsedLeaveDays(data.leaveRequests, user.id);

  const infoErrors = infoForm.formState.errors;
  const saveInfo = infoForm.handleSubmit(
    ({ phone, extension, status }) => {
      update((prev) => ({
        ...prev,
        members: prev.members.map((m) => (m.id === user.id ? { ...m, phone, extension, status } : m)),
      }));
      setInfoSaved(true);
    },
    () => setInfoSaved(false),
  );
  const infoError = infoErrors.phone?.message;

  const passwordErrors = passwordForm.formState.errors;
  const changePassword = passwordForm.handleSubmit(
    ({ currentPassword, nextPassword }) => {
      // 현재 비밀번호는 사용자 데이터와 비교해야 하므로 제출 시점에 검사한다.
      if (currentPassword !== user.password) {
        setPasswordChanged(false);
        passwordForm.setError("currentPassword", { message: "현재 비밀번호가 올바르지 않습니다." });
        return;
      }
      update((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === user.id ? { ...m, password: nextPassword, mustChangePassword: false } : m,
        ),
      }));
      passwordForm.reset();
      setPasswordChanged(true);
    },
    () => setPasswordChanged(false),
  );
  const passwordError =
    passwordErrors.currentPassword?.message ??
    passwordErrors.nextPassword?.message ??
    passwordErrors.confirmPassword?.message;

  return (
    <>
      <PageHeader title="내 정보" description="연락처와 근무 상태, 비밀번호를 관리합니다." />

      <Layout>
        <ProfileCard>
          <Avatar name={user.name} color={user.color} size={80} />
          <h2>{user.name}</h2>
          <p>
            {getDepartmentName(data, user.departmentId)} · {user.position}
          </p>
          <Badge $tone={user.isManager ? "primary" : "neutral"}>{ROLE_LABELS[user.role]}</Badge>
          <InfoList>
            <dt>이메일</dt>
            <dd>{user.email}</dd>
            <dt>입사일</dt>
            <dd>{formatDate(user.joinedAt)}</dd>
            <dt>연차</dt>
            <dd>
              {user.annualLeaveTotal - usedLeave}일 남음 / 총 {user.annualLeaveTotal}일
            </dd>
          </InfoList>
        </ProfileCard>

        <Stack>
          <Card>
            <CardHeader>
              <CardTitle>
                <UserRound />
                기본 정보
              </CardTitle>
            </CardHeader>
            <FormGrid>
              <Field label="이름" hint="이름·부서·직급 변경은 매니저에게 요청하세요.">
                {(id) => <Input id={id} value={user.name} readOnly />}
              </Field>
              <Field label="근무 상태">
                {(id) => (
                  <Select id={id} {...infoForm.register("status")}>
                    {(Object.keys(MEMBER_STATUS) as MemberStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {MEMBER_STATUS[s].label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="휴대폰" required>
                {(id) => (
                  <Input
                    id={id}
                    placeholder="010-1234-5678"
                    aria-invalid={!!infoErrors.phone}
                    {...infoForm.register("phone")}
                  />
                )}
              </Field>
              <Field label="내선번호">
                {(id) => <Input id={id} {...infoForm.register("extension")} />}
              </Field>
            </FormGrid>
            <Actions>
              {infoError ? <Feedback error>{infoError}</Feedback> : infoSaved && <Feedback>저장되었습니다.</Feedback>}
              <Button onClick={saveInfo}>
                <Save />
                저장
              </Button>
            </Actions>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <KeyRound />
                비밀번호 변경
              </CardTitle>
            </CardHeader>
            <FormGrid>
              <Field label="현재 비밀번호" required>
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={!!passwordErrors.currentPassword}
                    {...passwordForm.register("currentPassword")}
                  />
                )}
              </Field>
              <div />
              <Field label="새 비밀번호" required hint="8자 이상">
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordErrors.nextPassword}
                    {...passwordForm.register("nextPassword")}
                  />
                )}
              </Field>
              <Field label="새 비밀번호 확인" required>
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={!!passwordErrors.confirmPassword}
                    {...passwordForm.register("confirmPassword")}
                  />
                )}
              </Field>
            </FormGrid>
            <Actions>
              {passwordError ? (
                <Feedback error>{passwordError}</Feedback>
              ) : (
                passwordChanged && <Feedback>비밀번호가 변경되었습니다.</Feedback>
              )}
              <Button onClick={changePassword}>비밀번호 변경</Button>
            </Actions>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <RotateCcw />
                데모 데이터
              </CardTitle>
            </CardHeader>
            <p style={{ fontSize: 13, opacity: 0.75 }}>
              이 데모는 모든 데이터를 브라우저에 저장합니다. 초기화하면 운영자가 등록한 회사를 포함해 ChoiHub 전체 데이터가
              처음 상태로 돌아가고 로그아웃됩니다.
            </p>
            <Actions>
              <Button $variant="danger" onClick={() => setResetOpen(true)}>
                데이터 초기화
              </Button>
            </Actions>
          </Card>
        </Stack>
      </Layout>

      <ConfirmModal
        open={resetOpen}
        title="데모 데이터 초기화"
        message={"모든 데이터를 초기 상태로 되돌립니다.\n이 작업은 되돌릴 수 없습니다."}
        confirmLabel="초기화"
        danger
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          resetData();
          logout();
          router.replace("/login");
        }}
      />
    </>
  );
}
