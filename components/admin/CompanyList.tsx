"use client";

import styled from "@emotion/styled";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Badge,
  ButtonLink,
  EmptyState,
  MutedCell,
  PageHeader,
  SearchInput,
  Table,
  TableWrap,
  Toolbar,
} from "@/components/ui";
import { formatDate } from "@/lib/date";
import { usePlatform } from "@/lib/store";
import type { Tenant } from "@/lib/types";
import { mq } from "@/styles/theme";

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 24px;

  ${mq.md} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  div {
    padding: 16px 18px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.lg};
    background: ${({ theme }) => theme.colors.surface};
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 2px;
    font-size: 24px;
    font-weight: 800;
  }
`;

const Search = styled(SearchInput)`
  width: 100%;
  max-width: 320px;
`;

const NameCell = styled.td`
  strong {
    display: block;
    font-weight: 600;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

function managersOf(tenant: Tenant) {
  return tenant.data.members.filter((m) => m.role === "manager");
}

export function CompanyList() {
  const router = useRouter();
  const { platform } = usePlatform();
  const [query, setQuery] = useState("");

  const tenants = [...platform.tenants].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? tenants.filter((t) =>
        [t.data.company.name, t.data.company.businessNumber, t.data.company.ceo, ...managersOf(t).map((m) => m.email)]
          .join(" ")
          .toLowerCase()
          .includes(keyword),
      )
    : tenants;

  const activeCount = tenants.filter((t) => t.status === "active").length;
  const memberCount = tenants.reduce((sum, t) => sum + t.data.members.length, 0);

  return (
    <>
      <PageHeader
        title="회사 관리"
        description="ChoiHub를 이용하는 회사를 등록하고 회사별 매니저 계정을 발급합니다."
        actions={
          <ButtonLink href="/admin/companies/new">
            <Plus />
            회사 계정 발급
          </ButtonLink>
        }
      />

      <Stats>
        <div>
          <small>전체 회사</small>
          <strong>{tenants.length}</strong>
        </div>
        <div>
          <small>이용 중</small>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <small>이용 정지</small>
          <strong>{tenants.length - activeCount}</strong>
        </div>
        <div>
          <small>전체 구성원</small>
          <strong>{memberCount}</strong>
        </div>
      </Stats>

      <Toolbar>
        <Search
          type="search"
          placeholder="회사명, 사업자번호, 대표자, 매니저 이메일"
          aria-label="회사 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 />}
          title={keyword ? "검색 결과가 없습니다" : "등록된 회사가 없습니다"}
          description={keyword ? undefined : "회사 계정을 발급하면 해당 회사의 매니저가 로그인할 수 있습니다."}
        />
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>회사</th>
                <th>사업자등록번호</th>
                <th>대표자</th>
                <th>매니저</th>
                <th>구성원</th>
                <th>상태</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => {
                const managers = managersOf(tenant);
                return (
                  <tr key={tenant.id} data-clickable="true" onClick={() => router.push(`/admin/companies/${tenant.id}`)}>
                    <NameCell>
                      <strong>{tenant.data.company.name}</strong>
                      <small>{tenant.data.company.email}</small>
                    </NameCell>
                    <td>{tenant.data.company.businessNumber}</td>
                    <td>{tenant.data.company.ceo}</td>
                    <MutedCell>
                      {managers[0]?.email ?? "-"}
                      {managers.length > 1 && ` 외 ${managers.length - 1}명`}
                    </MutedCell>
                    <td>{tenant.data.members.length}명</td>
                    <td>
                      {tenant.status === "active" ? (
                        <Badge $tone="success">이용 중</Badge>
                      ) : (
                        <Badge $tone="danger">이용 정지</Badge>
                      )}
                    </td>
                    <MutedCell>{formatDate(tenant.createdAt)}</MutedCell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
