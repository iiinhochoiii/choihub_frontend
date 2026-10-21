"use client";

import styled from "@emotion/styled";
import { Heart, PenSquare } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { paginate, Pagination, PAGE_SIZE } from "@/components/articles/Pagination";
import {
  ButtonLink,
  EmptyState,
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
import { getMemberName } from "@/lib/selectors";
import { useData } from "@/lib/store";
import type { PostCategory } from "@/lib/types";

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
  const { data } = useData();
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return data.posts
      .filter(
        (p) =>
          (category === "all" || p.category === category) &&
          (!keyword ||
            p.title.toLowerCase().includes(keyword) ||
            p.content.toLowerCase().includes(keyword) ||
            getMemberName(data, p.authorId).includes(keyword)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data, category, query]);

  const current = paginate(filtered, page);

  const tabItems = [
    { value: "all" as const, label: "전체", count: data.posts.length },
    ...(Object.keys(POST_CATEGORIES) as PostCategory[]).map((key) => ({
      value: key,
      label: POST_CATEGORIES[key].label,
      count: data.posts.filter((p) => p.category === key).length,
    })),
  ];

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
          총 <strong>{filtered.length}</strong>개의 글
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

      <TableWrap>
        {filtered.length === 0 ? (
          <EmptyState
            title="게시글이 없습니다"
            description="첫 번째 글을 작성해 보세요."
            action={
              <ButtonLink href="/dashboard/board/new" $size="sm" style={{ marginTop: 8 }}>
                글쓰기
              </ButtonLink>
            }
          />
        ) : (
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
              {current.items.map((post, index) => (
                <tr
                  key={post.id}
                  data-clickable="true"
                  onClick={() => router.push(`/dashboard/board/${post.id}`)}
                >
                  <MutedCell>{filtered.length - ((current.page - 1) * PAGE_SIZE + index)}</MutedCell>
                  <td>
                    <StatusBadge value={POST_CATEGORIES[post.category]} />
                  </td>
                  <TitleCell>
                    <TitleLink
                      href={`/dashboard/board/${post.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{post.title}</span>
                      {post.comments.length > 0 && (
                        <CommentCount aria-label={`댓글 ${post.comments.length}개`}>
                          [{post.comments.length}]
                        </CommentCount>
                      )}
                    </TitleLink>
                  </TitleCell>
                  <td>{getMemberName(data, post.authorId)}</td>
                  <MutedCell>
                    {isWithinDays(post.createdAt, 1)
                      ? formatRelative(post.createdAt)
                      : formatDate(post.createdAt)}
                  </MutedCell>
                  <MutedCell>{post.views.toLocaleString()}</MutedCell>
                  <MutedCell>
                    <IconStat>
                      <Heart />
                      {post.likes.length}
                    </IconStat>
                  </MutedCell>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableWrap>

      <Pagination page={current.page} total={filtered.length} onChange={setPage} />
    </>
  );
}
