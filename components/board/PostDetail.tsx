"use client";

import styled from "@emotion/styled";
import { CalendarDays, Eye, Heart, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AdjacentNav,
  ArticleActions,
  ArticleBody,
  ArticleHeader,
  ArticleMeta,
  BackToList,
  NotFoundArticle,
  useCountViewOnce,
} from "@/components/articles/ArticleView";
import { Button, ButtonLink, Card, ConfirmModal, Person, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { POST_CATEGORIES } from "@/lib/labels";
import { getMember, getMemberSummary } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import { CommentSection } from "./CommentSection";

const LIST_HREF = "/dashboard/board";

const LikeArea = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 28px;
`;

const LikeButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  transition:
    background-color 0.15s,
    color 0.15s;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  &[aria-pressed="true"] {
    border-color: ${({ theme }) => theme.colors.danger};
    background: ${({ theme }) => theme.colors.dangerSoft};
    color: ${({ theme }) => theme.colors.danger};

    svg {
      fill: currentColor;
    }
  }
`;

export function PostDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, update } = useData();
  const user = useCurrentUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const post = data.posts.find((p) => p.id === id);

  const incrementViews = useCallback(
    (postId: string) =>
      update((prev) => ({
        ...prev,
        posts: prev.posts.map((p) => (p.id === postId ? { ...p, views: p.views + 1 } : p)),
      })),
    [update],
  );
  useCountViewOnce(id, !!post, incrementViews);

  if (!post) {
    return (
      <>
        <BackToList href={LIST_HREF} label="게시판 목록" />
        <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />
      </>
    );
  }

  const ordered = [...data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const index = ordered.findIndex((p) => p.id === post.id);
  const author = getMember(data, post.authorId);
  const isAuthor = post.authorId === user.id;
  const liked = post.likes.includes(user.id);

  const toggleLike = () =>
    update((prev) => ({
      ...prev,
      posts: prev.posts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              likes: p.likes.includes(user.id)
                ? p.likes.filter((m) => m !== user.id)
                : [...p.likes, user.id],
            }
          : p,
      ),
    }));

  const handleDelete = () => {
    update((prev) => ({ ...prev, posts: prev.posts.filter((p) => p.id !== post.id) }));
    router.replace(LIST_HREF);
  };

  return (
    <>
      <BackToList href={LIST_HREF} label="게시판 목록" />
      <Card $padding={24}>
        <ArticleHeader>
          <StatusBadge value={POST_CATEGORIES[post.category]} />
          <h1>{post.title}</h1>
          <ArticleMeta>
            <Person
              name={author?.name ?? "알 수 없음"}
              color={author?.color}
              caption={getMemberSummary(data, post.authorId)}
            />
            <span>
              <CalendarDays />
              {formatDateTime(post.createdAt)}
              {post.updatedAt !== post.createdAt && " (수정됨)"}
            </span>
            <span>
              <Eye />
              {post.views.toLocaleString()}
            </span>
          </ArticleMeta>
        </ArticleHeader>

        <ArticleBody>{post.content}</ArticleBody>

        <LikeArea>
          <LikeButton type="button" aria-pressed={liked} onClick={toggleLike}>
            <Heart />
            좋아요 {post.likes.length}
          </LikeButton>
        </LikeArea>

        {(isAuthor || user.isManager) && (
          <ArticleActions>
            {isAuthor && (
              <ButtonLink href={`${LIST_HREF}/${post.id}/edit`} $variant="secondary" $size="sm">
                <Pencil />
                수정
              </ButtonLink>
            )}
            <Button $variant="danger" $size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 />
              삭제
            </Button>
          </ArticleActions>
        )}
      </Card>

      <CommentSection post={post} />

      <AdjacentNav basePath={LIST_HREF} prev={ordered[index - 1]} next={ordered[index + 1]} />

      <ConfirmModal
        open={confirmOpen}
        title="게시글 삭제"
        message={`'${post.title}' 글을 삭제할까요?\n댓글도 함께 삭제되며 복구할 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
