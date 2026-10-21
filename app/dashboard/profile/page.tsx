"use client";

import styled from "@emotion/styled";
import { KeyRound, RotateCcw, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

const PHONE_PATTERN = /^\d{2,3}-\d{3,4}-\d{4}$/;

export default function ProfilePage() {
  const router = useRouter();
  const { data, update, reset } = useData();
  const { logout } = useAuth();
  const user = useCurrentUser();

  const [phone, setPhone] = useState(user.phone);
  const [extension, setExtension] = useState(user.extension);
  const [status, setStatus] = useState<MemberStatus>(user.status);
  const [infoMessage, setInfoMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const [resetOpen, setResetOpen] = useState(false);

  const usedLeave = getUsedLeaveDays(data.leaveRequests, user.id);

  const saveInfo = () => {
    if (!PHONE_PATTERN.test(phone)) {
      setInfoMessage({ text: "휴대폰 번호 형식을 확인해 주세요. (예: 010-1234-5678)", error: true });
      return;
    }
    update((prev) => ({
      ...prev,
      members: prev.members.map((m) => (m.id === user.id ? { ...m, phone, extension, status } : m)),
    }));
    setInfoMessage({ text: "저장되었습니다." });
  };

  const changePassword = () => {
    if (currentPassword !== user.password) {
      setPasswordMessage({ text: "현재 비밀번호가 올바르지 않습니다.", error: true });
      return;
    }
    if (nextPassword.length < 8) {
      setPasswordMessage({ text: "새 비밀번호는 8자 이상이어야 합니다.", error: true });
      return;
    }
    if (nextPassword !== confirmPassword) {
      setPasswordMessage({ text: "새 비밀번호가 일치하지 않습니다.", error: true });
      return;
    }
    update((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.id === user.id ? { ...m, password: nextPassword, mustChangePassword: false } : m,
      ),
    }));
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setPasswordMessage({ text: "비밀번호가 변경되었습니다." });
  };

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
                  <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as MemberStatus)}>
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
                  <Input id={id} value={phone} placeholder="010-1234-5678" onChange={(e) => setPhone(e.target.value)} />
                )}
              </Field>
              <Field label="내선번호">
                {(id) => <Input id={id} value={extension} onChange={(e) => setExtension(e.target.value)} />}
              </Field>
            </FormGrid>
            <Actions>
              {infoMessage && <Feedback error={infoMessage.error}>{infoMessage.text}</Feedback>}
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
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
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
                    value={nextPassword}
                    onChange={(e) => setNextPassword(e.target.value)}
                  />
                )}
              </Field>
              <Field label="새 비밀번호 확인" required>
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                )}
              </Field>
            </FormGrid>
            <Actions>
              {passwordMessage && <Feedback error={passwordMessage.error}>{passwordMessage.text}</Feedback>}
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
          reset();
          logout();
          router.replace("/login");
        }}
      />
    </>
  );
}
