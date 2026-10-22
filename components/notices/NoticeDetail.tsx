"use client";

import { CalendarDays, Eye, Pencil, Pin, Trash2 } from "lucide-react";
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
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmModal,
  ErrorState,
  LoadingState,
  Person,
  Row,
  StatusBadge,
} from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { NOTICE_CATEGORIES } from "@/lib/labels";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { useDeleteNotice, useNotice, useViewNotice } from "@/queries/notices";
import { UNKNOWN_MEMBER_NAME } from "@/lib/selectors";

const LIST_HREF = "/dashboard/notices";

export function NoticeDetail({ id }: { id: string }) {
  const router = useRouter();
  const { getMember, getMemberSummary } = useDirectory();
  const user = useCurrentUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: notice, isPending, error, refetch } = useNotice(id);
  const { mutate: viewNotice } = useViewNotice();
  const deleteNotice = useDeleteNotice();

  // 조회수는 서버가 올린다. 글을 불러온 뒤 한 번만 요청한다.
  useCountViewOnce(id, !!notice, viewNotice);

  if (isPending) {
    return (
      <>
        <BackToList href={LIST_HREF} label="공지사항 목록" />
        <LoadingState />
      </>
    );
  }

  if (error) {
    return (
      <>
        <BackToList href={LIST_HREF} label="공지사항 목록" />
        {isNotFoundError(error) ? (
          <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />
        ) : (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        )}
      </>
    );
  }

  const author = getMember(notice.authorId);

  const handleDelete = () =>
    deleteNotice.mutate(notice.id, { onSuccess: () => router.replace(LIST_HREF) });

  return (
    <>
      <BackToList href={LIST_HREF} label="공지사항 목록" />
      <Card $padding={24}>
        <ArticleHeader>
          <Row>
            <StatusBadge value={NOTICE_CATEGORIES[notice.category]} />
            {notice.pinned && (
              <Badge $tone="danger">
                <Pin />
                고정
              </Badge>
            )}
          </Row>
          <h1>{notice.title}</h1>
          <ArticleMeta>
            <Person
              name={author?.name ?? UNKNOWN_MEMBER_NAME}
              color={author?.color}
              caption={getMemberSummary(notice.authorId)}
            />
            <span>
              <CalendarDays />
              {formatDateTime(notice.createdAt)}
              {notice.updatedAt !== notice.createdAt && " (수정됨)"}
            </span>
            <span>
              <Eye />
              {notice.views.toLocaleString()}
            </span>
          </ArticleMeta>
        </ArticleHeader>

        <ArticleBody>{notice.content}</ArticleBody>

        {user.isManager && (
          <ArticleActions>
            <ButtonLink href={`${LIST_HREF}/${notice.id}/edit`} $variant="secondary" $size="sm">
              <Pencil />
              수정
            </ButtonLink>
            <Button
              $variant="danger"
              $size="sm"
              disabled={deleteNotice.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 />
              삭제
            </Button>
          </ArticleActions>
        )}
        {deleteNotice.error && <ActionError role="alert">{getErrorMessage(deleteNotice.error)}</ActionError>}
      </Card>

      <AdjacentNav basePath={LIST_HREF} prev={notice.prev} next={notice.next} />

      <ConfirmModal
        open={confirmOpen}
        title="공지 삭제"
        message={`'${notice.title}' 공지를 삭제할까요?\n삭제한 공지는 복구할 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
