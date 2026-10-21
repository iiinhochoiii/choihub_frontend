"use client";

import { ArrowLeft, Building2, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
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
import {
  type CompanyErrors,
  type CompanyForm,
  EMPTY_COMPANY,
  fromCompanyForm,
  toCompanyForm,
  validateCompany,
} from "@/lib/company";
import { createTenant, generatePassword, isBusinessNumberTaken } from "@/lib/platform";
import { usePlatform } from "@/lib/store";
import { CompanyFields } from "./CompanyFields";
import { EMPTY_MANAGER, type ManagerErrors, ManagerFields, type ManagerForm, validateManager } from "./ManagerFields";

interface Issued {
  tenantId: string;
  companyName: string;
  email: string;
  password: string;
  loginUrl: string;
}

export function CompanyCreate() {
  const { platform, updatePlatform } = usePlatform();
  const [company, setCompany] = useState<CompanyForm>(() => toCompanyForm(EMPTY_COMPANY));
  const [companyErrors, setCompanyErrors] = useState<CompanyErrors>({});
  const [manager, setManager] = useState<ManagerForm>(EMPTY_MANAGER);
  const [managerErrors, setManagerErrors] = useState<ManagerErrors>({});
  const [issued, setIssued] = useState<Issued | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextCompanyErrors = validateCompany(company);
    if (!nextCompanyErrors.businessNumber && isBusinessNumberTaken(platform, company.businessNumber)) {
      nextCompanyErrors.businessNumber = "이미 등록된 사업자등록번호입니다.";
    }
    const nextManagerErrors = validateManager(manager, platform);
    setCompanyErrors(nextCompanyErrors);
    setManagerErrors(nextManagerErrors);
    if (Object.keys(nextCompanyErrors).length > 0 || Object.keys(nextManagerErrors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const password = generatePassword();
    const tenant = createTenant(fromCompanyForm(company), { ...manager, password, mustChangePassword: true });
    updatePlatform((prev) => ({ ...prev, tenants: [...prev.tenants, tenant] }));
    setIssued({
      tenantId: tenant.id,
      companyName: tenant.data.company.name,
      email: manager.email.trim(),
      password,
      loginUrl: `${window.location.origin}/login`,
    });
    window.scrollTo({ top: 0 });
  };

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
            <Button type="submit">
              <Building2 />
              회사 계정 발급
            </Button>
          </>
        }
      />

      <Notice>
        <Info />
        <span>
          발급한 매니저 계정은 회사정보 수정, 구성원 추가, 결재 양식·회의실 관리 권한을 갖습니다. 초기 비밀번호는 자동으로
          만들어지고, 매니저는 첫 로그인 때 비밀번호를 변경해야 합니다.
        </span>
      </Notice>

      <Stack $gap={16}>
        <CompanyFields
          form={company}
          errors={companyErrors}
          editing
          onChange={(key, value) => setCompany((prev) => ({ ...prev, [key]: value }))}
        />
        <Card>
          <CardHeader>
            <CardTitle>매니저 계정</CardTitle>
          </CardHeader>
          <ManagerFields
            form={manager}
            errors={managerErrors}
            onChange={(key, value) => setManager((prev) => ({ ...prev, [key]: value }))}
          />
        </Card>
        <Row $justify="flex-end">
          <Button type="submit" $size="lg">
            <Building2 />
            회사 계정 발급
          </Button>
        </Row>
      </Stack>
    </form>
  );
}
