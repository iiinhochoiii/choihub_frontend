"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Ban, KeyRound, Pencil, Play, UserPlus } from "lucide-react";
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
  ErrorState,
  IconButton,
  LoadingState,
  Modal,
  MutedCell,
  Notice,
  PageHeader,
  Person,
  Stack,
  Table,
  TableWrap,
} from "@/components/ui";
import { ApiError, getErrorMessage } from "@/apis/defaultInstance";
import { formatDate } from "@/lib/date";
import { setServerErrors } from "@/lib/form";
import {
  type CompanyFormInput,
  type CompanyFormValues,
  companySchema,
  EMPTY_MANAGER,
  type ManagerFormValues,
  managerSchema,
  toCompanyFormInput,
} from "@/lib/schemas/company";
import {
  useActivateTenant,
  useAddManager,
  useResetManagerPassword,
  useSuspendTenant,
  useTenant,
  useUpdateTenantCompany,
} from "@/queries/admin";
import type { Member } from "@/types";
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
  const { data: tenant, isPending, error, refetch } = useTenant(tenantId);
  const updateCompany = useUpdateTenantCompany();
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();
  const addManagerMutation = useAddManager();
  const resetPasswordMutation = useResetManagerPassword();

  const [editing, setEditing] = useState(false);
  const [statusConfirm, setStatusConfirm] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<Member | null>(null);
  const [credential, setCredential] = useState<Credential | null>(null);
  /** 폼이 없는 동작(정지·재개, 비밀번호 초기화)과 폼 필드에 붙지 않는 저장 오류 */
  const [actionError, setActionError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const companyForm = useForm<CompanyFormInput, unknown, CompanyFormValues>({
    resolver: zodResolver(companySchema),
  });
  const managerForm = useForm<ManagerFormValues>({
    resolver: zodResolver(managerSchema),
    defaultValues: EMPTY_MANAGER,
  });

  if (isPending) return <LoadingState />;

  if (error) {
    if (error instanceof ApiError && error.status === 404) {
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
    return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const { company, managers, stats } = tenant;
  const suspended = tenant.status === "suspended";
  const statusPending = suspendTenant.isPending || activateTenant.isPending;

  const startEdit = () => {
    companyForm.reset(toCompanyFormInput(company));
    setActionError(null);
    setEditing(true);
  };

  const saveCompany = companyForm.handleSubmit((values) => {
    setActionError(null);
    // 사업자번호 중복은 서버가 검사한다.
    updateCompany.mutate(
      { id: tenantId, body: values },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => {
          if (!setServerErrors(err, companyForm.setError)) setActionError(getErrorMessage(err));
        },
      },
    );
  });

  const changeStatus = () => {
    setActionError(null);
    const mutation = suspended ? activateTenant : suspendTenant;
    mutation.mutate(tenantId, { onError: (err) => setActionError(getErrorMessage(err)) });
  };

  const addManager = managerForm.handleSubmit((values) => {
    setAddError(null);
    // 이메일 중복 검사, 기본 부서·연차 지정, 초기 비밀번호 생성은 서버가 한다.
    addManagerMutation.mutate(
      { id: tenantId, body: { ...values, position: values.position || undefined } },
      {
        onSuccess: ({ member, credential: issued }) => {
          setAddOpen(false);
          setCredential({ title: "매니저 계정 발급 완료", name: member.name, ...issued });
        },
        onError: (err) => {
          if (!setServerErrors(err, managerForm.setError)) setAddError(getErrorMessage(err));
        },
      },
    );
  });

  const resetPassword = (target: Member) => {
    setActionError(null);
    resetPasswordMutation.mutate(
      { id: tenantId, memberId: target.id },
      {
        onSuccess: ({ credential: issued }) =>
          setCredential({ title: "비밀번호 초기화 완료", name: target.name, ...issued }),
        onError: (err) => setActionError(getErrorMessage(err)),
      },
    );
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
            <Button
              $variant={suspended ? "primary" : "danger"}
              disabled={statusPending}
              onClick={() => setStatusConfirm(true)}
            >
              {suspended ? <Play /> : <Ban />}
              {suspended ? "이용 재개" : "이용 정지"}
            </Button>
          </>
        }
      />

      {actionError && (
        <Notice $tone="warning">
          <AlertCircle />
          <span>{actionError}</span>
        </Notice>
      )}

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
              <strong>{stats.members}명</strong>
            </div>
            <div>
              <small>매니저</small>
              <strong>{stats.managers}명</strong>
            </div>
            <div>
              <small>부서</small>
              <strong>{stats.departments}개</strong>
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
                setAddError(null);
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
                      <IconButton
                        aria-label={`${m.name} 비밀번호 초기화`}
                        title="비밀번호 초기화"
                        disabled={resetPasswordMutation.isPending}
                        onClick={() => setResetTarget(m)}
                      >
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
                  <Button type="submit" $size="sm" disabled={updateCompany.isPending}>
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
        onConfirm={changeStatus}
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
            <Button onClick={addManager} disabled={addManagerMutation.isPending}>
              발급
            </Button>
          </>
        }
      >
        {addError && (
          <Notice $tone="warning">
            <AlertCircle />
            <span>{addError}</span>
          </Notice>
        )}
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
