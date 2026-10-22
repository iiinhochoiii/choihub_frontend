"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Ban, KeyRound, Pencil, Play, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CredentialCard } from "@/components/common/CredentialCard";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardHeader,
  CardTitle,
  ConfirmModal,
  EmptyState,
  IconButton,
  Modal,
  MutedCell,
  Notice,
  PageHeader,
  Person,
  Stack,
  Table,
  TableWrap,
} from "@/components/ui";
import { formatDate } from "@/lib/date";
import { createId } from "@/lib/id";
import { generatePassword, isBusinessNumberTaken, isEmailTaken, pickAvatarColor } from "@/lib/platform";
import {
  type CompanyFormInput,
  type CompanyFormValues,
  companySchema,
  EMPTY_MANAGER,
  type ManagerFormValues,
  managerSchema,
  toCompanyFormInput,
} from "@/lib/schemas/company";
import { usePlatform } from "@/lib/store";
import type { GroupwareData, Member, Tenant } from "@/lib/types";
import { mq } from "@/styles/theme";
import { CompanyFields } from "./CompanyFields";
import { ManagerFields } from "./ManagerFields";

const Summary = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  ${mq.md} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  div {
    padding: 14px 16px;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 2px;
    font-size: 18px;
    font-weight: 700;
  }
`;

type Credential = { title: string; name: string; email: string; password: string };

export function CompanyDetail({ tenantId }: { tenantId: string }) {
  const { platform, updatePlatform } = usePlatform();
  const tenant = platform.tenants.find((t) => t.id === tenantId);

  const [editing, setEditing] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  const companyForm = useForm<CompanyFormInput, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
  });
  const managerForm = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: EMPTY_MANAGER,
  });

  if (!tenant) {
    return (
      <EmptyState
        title="회사를 찾을 수 없습니다"
        action={
          <ButtonLink href="/admin" $variant="secondary">
            목록으로
          </ButtonLink>
        }
      />
    );
  }

  const { company } = tenant.data;
  const managers = tenant.data.members.filter((m) => m.role === "manager");
  const suspended = tenant.status === "suspended";

  const updateTenant = (updater: (t: Tenant) => Tenant) =>
    updatePlatform((prev) => ({
      ...prev,
      tenants: prev.tenants.map((t) => (t.id === tenantId ? updater(t) : t)),
    }));
  const updateData = (updater: (d: GroupwareData) => GroupwareData) =>
    updateTenant((t) => ({ ...t, data: updater(t.data) }));

  const startEdit = () => {
    companyForm.reset(toCompanyFormInput(company));
    setEditing(true);
  };

  const saveCompany = companyForm.handleSubmit((values) => {
    if (isBusinessNumberTaken(platform, values.businessNumber, tenantId)) {
      return companyForm.setError("businessNumber", { message: "이미 등록된 사업자등록번호입니다." });
    }
    updateData((d) => ({ ...d, company: values }));
    setEditing(false);
  });

  const addManager = managerForm.handleSubmit((values) => {
    if (isEmailTaken(platform, values.email)) {
      return managerForm.setError("email", { message: "이미 ChoiHub에서 사용 중인 이메일입니다." });
    }
    const password = generatePassword();
    const member: Member = {
      id: createId("m"),
      name: values.name,
      email: values.email,
      password,
      role: "manager",
      departmentId: tenant.data.departments[0]?.id ?? "",
      position: values.position || "매니저",
      phone: values.phone,
      extension: "",
      joinedAt: new Date().toISOString().slice(0, 10),
      birthday: "",
      status: "active",
      annualLeaveTotal: company.defaultAnnualLeave,
      color: pickAvatarColor(tenant.data.members.length),
      mustChangePassword: true,
    };
    updateData((d) => ({ ...d, members: [...d.members, member] }));
    setAddOpen(false);
    setCredential({ title: "매니저 계정 발급 완료", name: member.name, email: member.email, password });
  });

  const resetPassword = (target: Member) => {
    const password = generatePassword();
    updateData((d) => ({
      ...d,
      members: d.members.map((m) => (m.id === target.id ? { ...m, password, mustChangePassword: true } : m)),
    }));
    setCredential({ title: "비밀번호 초기화 완료", name: target.name, email: target.email, password });
  };

  return (
    <>
      <PageHeader
        title={company.name}
        description={`사업자등록번호 ${company.businessNumber} · 등록일 ${formatDate(tenant.createdAt)}`}
        actions={
          <>
            <ButtonLink href="/admin" $variant="secondary">
              <ArrowLeft />
              목록
            </ButtonLink>
            <Button $variant={suspended ? "primary" : "danger"} onClick={() => setStatusConfirm(true)}>
              {suspended ? <Play /> : <Ban />}
              {suspended ? "이용 재개" : "이용 정지"}
            </Button>
          </>
        }
      />

      {suspended && (
        <Notice $tone="warning">
          <Ban />
          이용이 정지된 회사입니다. 이 회사의 구성원은 로그인할 수 없습니다.
        </Notice>
      )}

      <Stack $gap={16}>
        <Card>
          <Summary>
            <div>
              <small>상태</small>
              <strong>{suspended ? "이용 정지" : "이용 중"}</strong>
            </div>
            <div>
              <small>구성원</small>
              <strong>{tenant.data.members.length}명</strong>
            </div>
            <div>
              <small>매니저</small>
              <strong>{managers.length}명</strong>
            </div>
            <div>
              <small>부서</small>
              <strong>{tenant.data.departments.length}개</strong>
            </div>
          </Summary>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>매니저 계정</CardTitle>
            <Button
              $size="sm"
              onClick={() => {
                managerForm.reset(EMPTY_MANAGER);
                setAddOpen(true);
              }}
            >
              <UserPlus />
              매니저 추가
            </Button>
          </CardHeader>
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일 (로그인 ID)</th>
                  <th>휴대폰</th>
                  <th>계정 상태</th>
                  <th style={{ width: 80 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {managers.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Person name={m.name} color={m.color} caption={m.position} />
                    </td>
                    <td>{m.email}</td>
                    <MutedCell>{m.phone || "-"}</MutedCell>
                    <td>
                      {m.mustChangePassword ? (
                        <Badge $tone="warning">비밀번호 변경 대기</Badge>
                      ) : (
                        <Badge $tone="success">사용 중</Badge>
                      )}
                    </td>
                    <td>
                      <IconButton aria-label={`${m.name} 비밀번호 초기화`} title="비밀번호 초기화" onClick={() => setResetTarget(m)}>
                        <KeyRound />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
          <p style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            일반 구성원은 각 회사의 매니저가 직접 추가합니다. 운영 콘솔에서는 매니저 계정만 관리합니다.
          </p>
        </Card>

        <form onSubmit={saveCompany} noValidate>
          <Stack $gap={16}>
            <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <CardTitle>회사 정보</CardTitle>
              {editing ? (
                <span style={{ display: "flex", gap: 8 }}>
                  <Button $variant="secondary" $size="sm" onClick={() => setEditing(false)}>
                    취소
                  </Button>
                  <Button type="submit" $size="sm">
                    저장
                  </Button>
                </span>
              ) : (
                <Button $variant="secondary" $size="sm" onClick={startEdit}>
                  <Pencil />
                  수정
                </Button>
              )}
            </Card>
            <CompanyFields
              company={company}
              editing={editing}
              register={companyForm.register}
              errors={companyForm.formState.errors}
            />
          </Stack>
        </form>
      </Stack>

      <ConfirmModal
        open={statusConfirm}
        title={suspended ? "이용 재개" : "이용 정지"}
        message={
          suspended
            ? `${company.name}의 이용을 재개합니다.\n구성원이 다시 로그인할 수 있습니다.`
            : `${company.name}의 이용을 정지합니다.\n이 회사의 모든 구성원이 로그인할 수 없게 됩니다. 데이터는 삭제되지 않습니다.`
        }
        confirmLabel={suspended ? "재개" : "정지"}
        danger={!suspended}
        onClose={() => setStatusConfirm(false)}
        onConfirm={() => updateTenant((t) => ({ ...t, status: suspended ? "active" : "suspended" }))}
      />

      <Modal
        open={addOpen}
        title="매니저 추가"
        width={600}
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button $variant="secondary" onClick={() => setAddOpen(false)}>
              취소
            </Button>
            <Button onClick={addManager}>발급</Button>
          </>
        }
      >
        <ManagerFields register={managerForm.register} errors={managerForm.formState.errors} />
      </Modal>

      <ConfirmModal
        open={resetTarget !== null}
        title="비밀번호 초기화"
        message={`${resetTarget?.name ?? ""}님의 비밀번호를 새 초기 비밀번호로 바꿉니다.\n기존 비밀번호로는 더 이상 로그인할 수 없습니다.`}
        confirmLabel="초기화"
        danger
        onClose={() => setResetTarget(null)}
        onConfirm={() => resetTarget && resetPassword(resetTarget)}
      />

      <Modal
        open={credential !== null}
        title={credential?.title ?? ""}
        onClose={() => setCredential(null)}
        footer={<Button onClick={() => setCredential(null)}>확인</Button>}
      >
        {credential && (
          <>
            <p style={{ marginBottom: 16 }}>
              <strong>{credential.name}</strong>님에게 아래 로그인 정보를 전달하세요.
            </p>
            <CredentialCard email={credential.email} password={credential.password} />
          </>
        )}
      </Modal>
    </>
  );
}
