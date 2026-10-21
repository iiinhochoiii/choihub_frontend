"use client";

import styled from "@emotion/styled";
import { Pin, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { paginate, Pagination, PAGE_SIZE } from "@/components/articles/Pagination";
import {
  ButtonLink,
  ChipGroup,
  EmptyState,
  MutedCell,
  PageHeader,
  SearchInput,
  StatusBadge,
  Table,
  TableWrap,
  TitleCell,
  Toolbar,
} from "@/components/ui";
import { formatDate, isWithinDays } from "@/lib/date";
import { NOTICE_CATEGORIES } from "@/lib/labels";
import { getMemberName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { Notice, NoticeCategory } from "@/lib/types";

type CategoryFilter = "all" | NoticeCategory;

const Search = styled(SearchInput)`
  width: 100%;

  @media (min-width: 640px) {
    width: 260px;
  }
`;

const TitleLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.danger};
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover span {
    text-decoration: underline;
  }
`;

const PinnedRow = styled.tr`
  td {
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }
`;

const NewMark = styled.em`
  flex-shrink: 0;
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

/** 고정 공지 먼저, 그다음 최신순 */
export function sortNotices(notices: Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function NoticeList() {
  const router = useRouter();
  const { data } = useData();
  const user = useCurrentUser();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return sortNotices(
      data.notices.filter(
        (n) =>
          (category === "all" || n.category === category) &&
          (!keyword ||
            n.title.toLowerCase().includes(keyword) ||
            n.content.toLowerCase().includes(keyword)),
      ),
    );
  }, [data.notices, category, query]);

  const current = paginate(filtered, page);

  const categoryItems = [
    { value: "all" as const, label: "전체", count: data.notices.length },
    ...(Object.keys(NOTICE_CATEGORIES) as NoticeCategory[]).map((key) => ({
      value: key,
      label: NOTICE_CATEGORIES[key].label,
      count: data.notices.filter((n) => n.category === key).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title="공지사항"
        description="회사의 주요 소식과 안내 사항을 확인하세요."
        actions={
          user.isManager && (
            <ButtonLink href="/dashboard/notices/new">
              <Plus />
              공지 작성
            </ButtonLink>
          )
        }
      />

      <Toolbar>
        <ChipGroup
          items={categoryItems}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
        <Search
          type="search"
          placeholder="제목, 내용 검색"
          aria-label="공지사항 검색"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </Toolbar>

      <TableWrap>
        {filtered.length === 0 ? (
          <EmptyState title="공지사항이 없습니다" description="검색어나 분류를 바꿔 보세요." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th style={{ width: 72 }}>번호</th>
                <th style={{ width: 90 }}>분류</th>
                <th>제목</th>
                <th style={{ width: 110 }}>작성자</th>
                <th style={{ width: 110 }}>작성일</th>
                <th style={{ width: 80 }}>조회</th>
              </tr>
            </thead>
            <tbody>
              {current.items.map((notice, index) => {
                const RowTag = notice.pinned ? PinnedRow : "tr";
                const number = filtered.length - ((current.page - 1) * PAGE_SIZE + index);
                return (
                  <RowTag
                    key={notice.id}
                    data-clickable="true"
                    onClick={() => router.push(`/dashboard/notices/${notice.id}`)}
                  >
                    <MutedCell>{notice.pinned ? "공지" : number}</MutedCell>
                    <td>
                      <StatusBadge value={NOTICE_CATEGORIES[notice.category]} />
                    </td>
                    <TitleCell>
                      <TitleLink
                        href={`/dashboard/notices/${notice.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {notice.pinned && <Pin aria-label="고정" />}
                        <span>{notice.title}</span>
                        {isWithinDays(notice.createdAt, 3) && <NewMark>N</NewMark>}
                      </TitleLink>
                    </TitleCell>
                    <td>{getMemberName(data, notice.authorId)}</td>
                    <MutedCell>{formatDate(notice.createdAt)}</MutedCell>
                    <MutedCell>{notice.views.toLocaleString()}</MutedCell>
                  </RowTag>
                );
              })}
            </tbody>
          </Table>
        )}
      </TableWrap>

      <Pagination page={current.page} total={filtered.length} onChange={setPage} />
    </>
  );
}
