"use client";

import styled from "@emotion/styled";
import { CalendarDays, Eye, Heart, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  ActionError,
  AdjacentNav,
  ArticleActions,
  ArticleBody,
  ArticleHeader,
  ArticleMeta,
  BackToList,
  isNotFoundError,
  NotFoundArticle,
  useCountViewOnce,
} from "@/components/articles/ArticleView";
import {
  Button,
  ButtonLink,
  Card,
  ConfirmModal,
  ErrorState,
  LoadingState,
  Person,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { POST_CATEGORIES } from "@/lib/labels";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { useDeletePost, usePost, useTogglePostLike, useViewPost } from "@/queries/posts";
import { CommentSection } from "./CommentSection";
import { UNKNOWN_MEMBER_NAME } from "@/lib/selectors";

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
  const { getMember, getMemberSummary } = useDirectory();
  const user = useCurrentUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: post, isPending, error, refetch } = usePost(id);
  const { mutate: viewPost } = useViewPost();
  const toggleLike = useTogglePostLike(user.id);
  const deletePost = useDeletePost();

  // 조회수는 서버가 올린다. 글을 불러온 뒤 한 번만 요청한다.
  useCountViewOnce(id, !!post, viewPost);

  if (isPending) {
    return (
      <>
        <BackToList href={LIST_HREF} label="게시판 목록" />
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        <BackToList href={LIST_HREF} label="게시판 목록" />
        {isNotFoundError(error) ? (
          <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />
        ) : (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        )}
      </>
    );
  }

  const author = getMember(post.authorId);
  const isAuthor = post.authorId === user.id;
  const liked = post.likes.includes(user.id);
  const actionError = toggleLike.error ?? deletePost.error;

  const handleDelete = () => deletePost.mutate(post.id, { onSuccess: () => router.replace(LIST_HREF) });

  return (
    <>
      <BackToList href={LIST_HREF} label="게시판 목록" />
      <Card $padding={24}>
        <ArticleHeader>
          <StatusBadge value={POST_CATEGORIES[post.category]} />
          <h1>{post.title}</h1>
          <ArticleMeta>
            <Person
              name={author?.name ?? UNKNOWN_MEMBER_NAME}
              color={author?.color}
              caption={getMemberSummary(post.authorId)}
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
          <LikeButton
            type="button"
            aria-pressed={liked}
            disabled={toggleLike.isPending}
            onClick={() => toggleLike.mutate(post.id)}
          >
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
            <Button
              $variant="danger"
              $size="sm"
              disabled={deletePost.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 />
              삭제
            </Button>
          </ArticleActions>
        )}
        {actionError && <ActionError role="alert">{getErrorMessage(actionError)}</ActionError>}
      </Card>

      <CommentSection post={post} />

      <AdjacentNav basePath={LIST_HREF} prev={post.prev} next={post.next} />

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
