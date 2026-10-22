"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CredentialCard } from "@/components/common/CredentialCard";
import {
  Button,
  ButtonLink,
  Card,
  CardHeader,
  CardTitle,
  Notice,
  PageHeader,
  Row,
  Stack,
} from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { EMPTY_COMPANY } from "@/lib/company";
import { setServerErrors } from "@/lib/form";
import {
  type CompanyCreateFormInput,
  type CompanyCreateFormValues,
  companyCreateSchema,
  EMPTY_MANAGER,
  toCompanyFormInput,
} from "@/lib/schemas/company";
import { useCreateTenant } from "@/queries/admin";
import { CompanyFields } from "./CompanyFields";
import { ManagerFields } from "./ManagerFields";

interface Issued {
  tenantId: string;
  companyName: string;
  email: string;
  password: string;
  loginUrl: string;
}

export function CompanyCreate() {
  const createTenant = useCreateTenant();
  const [issued, setIssued] = useState<Issued | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CompanyCreateFormInput, unknown, CompanyCreateFormValues>({
    resolver: zodResolver(companyCreateSchema),
    defaultValues: { company: toCompanyFormInput(EMPTY_COMPANY), manager: EMPTY_MANAGER },
  });

  const scrollToErrors = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const submit = handleSubmit(({ company, manager }) => {
    setSubmitError(null);
    // 사업자번호·이메일 중복 검사와 초기 비밀번호 생성은 서버가 한다.
    createTenant.mutate(
      { company, manager: { ...manager, position: manager.position || undefined } },
      {
        onSuccess: ({ tenant, credential }) => {
          setIssued({
            tenantId: tenant.id,
            companyName: tenant.company.name,
            email: credential.email,
            password: credential.password,
            loginUrl: `${window.location.origin}/login`,
          });
          window.scrollTo({ top: 0 });
        },
        onError: (error) => {
          // 서버 필드 경로("company.businessNumber", "manager.email")가 폼 필드 이름과 같다.
          if (!setServerErrors(error, setError)) setSubmitError(getErrorMessage(error));
          scrollToErrors();
        },
      },
    );
  }, scrollToErrors);

  if (issued) {
    return (
      <>
        <PageHeader title="회사 계정 발급 완료" />
        <Card style={{ maxWidth: 640 }}>
          <Stack $gap={16}>
            <Row $gap={8}>
              <CheckCircle2 size={20} color="currentColor" />
              <span>
                <strong>{issued.companyName}</strong>의 회사 계정(매니저)을 발급했습니다.
              </span>
            </Row>
            <CredentialCard title="매니저 로그인 정보" loginUrl={issued.loginUrl} email={issued.email} password={issued.password} />
            <p style={{ fontSize: 13, opacity: 0.75 }}>
              매니저는 로그인 후 회사정보를 확인·수정하고, 구성원 메뉴에서 직원 계정을 추가할 수 있습니다. 기본 부서(경영지원)와
              결재 양식 2종이 함께 만들어졌습니다.
            </p>
            <Row $justify="flex-end">
              <ButtonLink href="/admin" $variant="secondary">
                목록으로
              </ButtonLink>
              <ButtonLink href={`/admin/companies/${issued.tenantId}`}>회사 상세 보기</ButtonLink>
            </Row>
          </Stack>
        </Card>
      </>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title="회사 계정 발급"
        description="회사 정보를 등록하고, 그 회사를 관리할 매니저 계정을 발급합니다."
        actions={
          <>
            <ButtonLink href="/admin" $variant="secondary">
              <ArrowLeft />
              취소
            </ButtonLink>
            <Button type="submit" disabled={createTenant.isPending}>
              <Building2 />
              회사 계정 발급
            </Button>
          </>
        }
      />

      {submitError && (
        <Notice $tone="warning">
          <AlertCircle />
          <span>{submitError}</span>
        </Notice>
      )}

      <Notice>
        <Info />
        <span>
          발급한 매니저 계정은 회사정보 수정, 구성원 추가, 결재 양식·회의실 관리 권한을 갖습니다. 초기 비밀번호는 자동으로
          만들어지고, 매니저는 첫 로그인 때 비밀번호를 변경해야 합니다.
        </span>
      </Notice>

      <Stack $gap={16}>
        <CompanyFields
          company={EMPTY_COMPANY}
          editing
          register={(key) => register(`company.${key}`)}
          errors={errors.company}
        />
        <Card>
          <CardHeader>
            <CardTitle>매니저 계정</CardTitle>
          </CardHeader>
          <ManagerFields register={(key) => register(`manager.${key}`)} errors={errors.manager} />
        </Card>
        <Row $justify="flex-end">
          <Button type="submit" $size="lg" disabled={createTenant.isPending}>
            <Building2 />
            회사 계정 발급
          </Button>
        </Row>
      </Stack>
    </form>
  );
}
