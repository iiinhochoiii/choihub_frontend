"use client";

import styled from "@emotion/styled";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Badge,
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
  MutedCell,
  PageHeader,
  SearchInput,
  Table,
  TableWrap,
  Toolbar,
} from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { formatDate } from "@/lib/date";
import { useTenants } from "@/queries/admin";
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

/** 입력이 멈춘 뒤에 서버 검색을 요청한다. */
const SEARCH_DEBOUNCE_MS = 300;

export function CompanyList() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // 검색·정렬(최근 등록 순)·통계는 서버가 처리한다.
  const { data, isPending, error, refetch } = useTenants(keyword);
  const stats = data?.stats;
  const tenants = data?.items ?? [];

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
          <strong>{stats?.total ?? "-"}</strong>
        </div>
        <div>
          <small>이용 중</small>
          <strong>{stats?.active ?? "-"}</strong>
        </div>
        <div>
          <small>이용 정지</small>
          <strong>{stats?.suspended ?? "-"}</strong>
        </div>
        <div>
          <small>전체 구성원</small>
          <strong>{stats?.members ?? "-"}</strong>
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

      {isPending ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : tenants.length === 0 ? (
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
              {tenants.map((tenant) => {
                const managers = tenant.managerEmails;
                return (
                  <tr key={tenant.id} data-clickable="true" onClick={() => router.push(`/admin/companies/${tenant.id}`)}>
                    <NameCell>
                      <strong>{tenant.company.name}</strong>
                      <small>{tenant.company.email}</small>
                    </NameCell>
                    <td>{tenant.company.businessNumber}</td>
                    <td>{tenant.company.ceo}</td>
                    <MutedCell>
                      {managers[0] ?? "-"}
                      {managers.length > 1 && ` 외 ${managers.length - 1}명`}
                    </MutedCell>
                    <td>{tenant.memberCount}명</td>
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
