"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Save, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Field,
  FormGrid,
  Input,
  PageHeader,
  Select,
  Stack,
} from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { formatDate } from "@/lib/date";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import {
  type PasswordChangeFormValues,
  passwordChangeSchema,
  type ProfileFormValues,
  profileSchema,
} from "@/lib/schemas/account";
import { setServerErrors } from "@/lib/form";
import { useLeaveBalance } from "@/queries/attendance";
import { useChangePassword, useCurrentUser } from "@/queries/auth";
import { useDirectory, useUpdateProfile } from "@/queries/directory";
import type { MemberStatus } from "@/types";
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
  const user = useCurrentUser();
  const { getDepartmentName } = useDirectory();
  // 남은 연차는 서버가 승인된 휴가를 합산해 계산한다.
  const { data: balance } = useLeaveBalance();
  const updateProfile = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const infoForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { phone: user.phone, extension: user.extension, status: user.status },
  });
  const [infoSaved, setInfoSaved] = useState(false);
  const [infoServerError, setInfoServerError] = useState<string | null>(null);

  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", nextPassword: "", confirmPassword: "" },
  });
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);

  const infoErrors = infoForm.formState.errors;
  const saveInfo = infoForm.handleSubmit(
    (values) => {
      setInfoSaved(false);
      setInfoServerError(null);
      updateProfile.mutate(values, {
        onSuccess: () => setInfoSaved(true),
        onError: (error) => {
          if (!setServerErrors(error, infoForm.setError)) setInfoServerError(getErrorMessage(error));
        },
      });
    },
    () => setInfoSaved(false),
  );
  const infoError =
    infoErrors.phone?.message ?? infoErrors.extension?.message ?? infoErrors.status?.message ?? infoServerError;

  const passwordErrors = passwordForm.formState.errors;
  const changePassword = passwordForm.handleSubmit(
    (values) => {
      setPasswordChanged(false);
      setPasswordServerError(null);
      // 현재 비밀번호 확인은 서버가 한다.
      changePasswordMutation.mutate(values, {
        onSuccess: () => {
          passwordForm.reset();
          setPasswordChanged(true);
        },
        onError: (error) => {
          if (!setServerErrors(error, passwordForm.setError)) setPasswordServerError(getErrorMessage(error));
        },
      });
    },
    () => setPasswordChanged(false),
  );
  const passwordError =
    passwordErrors.currentPassword?.message ??
    passwordErrors.nextPassword?.message ??
    passwordErrors.confirmPassword?.message ??
    passwordServerError;

  return (
    <>
      <PageHeader title="내 정보" description="연락처와 근무 상태, 비밀번호를 관리합니다." />

      <Layout>
        <ProfileCard>
          <Avatar name={user.name} color={user.color} size={80} />
          <h2>{user.name}</h2>
          <p>
            {getDepartmentName(user.departmentId)} · {user.position}
          </p>
          <Badge $tone={user.isManager ? "primary" : "neutral"}>{ROLE_LABELS[user.role]}</Badge>
          <InfoList>
            <dt>이메일</dt>
            <dd>{user.email}</dd>
            <dt>입사일</dt>
            <dd>{formatDate(user.joinedAt)}</dd>
            <dt>연차</dt>
            <dd>
              {balance ? `${balance.total - balance.used}일 남음 / 총 ${balance.total}일` : "-"}
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
              <Button onClick={saveInfo} disabled={updateProfile.isPending}>
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
              <Button onClick={changePassword} disabled={changePasswordMutation.isPending}>
                비밀번호 변경
              </Button>
            </Actions>
          </Card>
        </Stack>
      </Layout>
    </>
  );
}
