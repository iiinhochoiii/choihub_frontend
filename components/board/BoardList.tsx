"use client";

import styled from "@emotion/styled";
import { Heart, PenSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Pagination } from "@/components/articles/Pagination";
import {
  ButtonLink,
  EmptyState,
  ErrorState,
  LoadingState,
  MutedCell,
  PageHeader,
  SearchInput,
  StatusBadge,
  Table,
  TableWrap,
  Tabs,
  TitleCell,
  Toolbar,
} from "@/components/ui";
import { formatDate, formatRelative, isWithinDays } from "@/lib/date";
import { POST_CATEGORIES } from "@/lib/labels";
import { useDirectory } from "@/queries/directory";
import { usePosts } from "@/queries/posts";
import type { PostCategory } from "@/types";

type CategoryFilter = "all" | PostCategory;

const TabsWrap = styled.div`
  margin-bottom: 16px;
`;

const Search = styled(SearchInput)`
  width: 100%;

  @media (min-width: 640px) {
    width: 260px;
  }
`;

const ResultCount = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const TitleLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover span {
    text-decoration: underline;
  }
`;

const CommentCount = styled.em`
  flex-shrink: 0;
  font-style: normal;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`;

const IconStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export function BoardList() {
  const router = useRouter();
  const { getMemberName } = useDirectory();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // 페이지·분류·검색(제목·내용·작성자 이름)·최신순 정렬은 서버가 처리한다.
  const { data, isPending, error, refetch } = usePosts({
    page,
    category: category === "all" ? undefined : category,
    q: query.trim(),
  });

  const counts = data?.categoryCounts;
  const tabItems = [
    { value: "all" as const, label: "전체", count: counts?.all ?? 0 },
    ...(Object.keys(POST_CATEGORIES) as PostCategory[]).map((key) => ({
      value: key,
      label: POST_CATEGORIES[key].label,
      count: counts?.[key] ?? 0,
    })),
  ];

  const renderTable = () => {
    if (isPending) return <LoadingState />;
    if (error) return <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />;
    if (data.items.length === 0) {
      return (
        <EmptyState
          title="게시글이 없습니다"
          description="첫 번째 글을 작성해 보세요."
          action={
            <ButtonLink href="/dashboard/board/new" $size="sm" style={{ marginTop: 8 }}>
              글쓰기
            </ButtonLink>
          }
        />
      );
    }
    return (
      <Table>
        <thead>
          <tr>
            <th style={{ width: 72 }}>번호</th>
            <th style={{ width: 100 }}>분류</th>
            <th>제목</th>
            <th style={{ width: 110 }}>작성자</th>
            <th style={{ width: 110 }}>작성일</th>
            <th style={{ width: 80 }}>조회</th>
            <th style={{ width: 80 }}>좋아요</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((post, index) => (
            <tr key={post.id} data-clickable="true" onClick={() => router.push(`/dashboard/board/${post.id}`)}>
              <MutedCell>{data.total - ((data.page - 1) * data.pageSize + index)}</MutedCell>
              <td>
                <StatusBadge value={POST_CATEGORIES[post.category]} />
              </td>
              <TitleCell>
                <TitleLink href={`/dashboard/board/${post.id}`} onClick={(e) => e.stopPropagation()}>
                  <span>{post.title}</span>
                  {post.commentCount > 0 && (
                    <CommentCount aria-label={`댓글 ${post.commentCount}개`}>[{post.commentCount}]</CommentCount>
                  )}
                </TitleLink>
              </TitleCell>
              <td>{getMemberName(post.authorId)}</td>
              <MutedCell>
                {isWithinDays(post.createdAt, 1) ? formatRelative(post.createdAt) : formatDate(post.createdAt)}
              </MutedCell>
              <MutedCell>{post.views.toLocaleString()}</MutedCell>
              <MutedCell>
                <IconStat>
                  <Heart />
                  {post.likeCount}
                </IconStat>
              </MutedCell>
            </tr>
          ))}
        </tbody>
      </Table>
    );
  };

  return (
    <>
      <PageHeader
        title="게시판"
        description="동료들과 자유롭게 이야기와 정보를 나눠보세요."
        actions={
          <ButtonLink href="/dashboard/board/new">
            <PenSquare />
            글쓰기
          </ButtonLink>
        }
      />

      <TabsWrap>
        <Tabs
          items={tabItems}
          value={category}
          onChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        />
      </TabsWrap>

      <Toolbar>
        <ResultCount>
          총 <strong>{data?.total ?? 0}</strong>개의 글
        </ResultCount>
        <Search
          type="search"
          placeholder="제목, 내용, 작성자 검색"
          aria-label="게시글 검색"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
      </Toolbar>

      <TableWrap>{renderTable()}</TableWrap>

      {data && (
        <Pagination page={data.page} total={data.total} pageSize={data.pageSize} onChange={setPage} />
      )}
    </>
  );
}
