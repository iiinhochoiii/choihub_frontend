"use client";

import { CalendarDays, Eye, Pencil, Pin, Trash2 } from "lucide-react";
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
import { Badge, Button, ButtonLink, Card, ConfirmModal, Person, Row, StatusBadge } from "@/components/ui";
import { formatDateTime } from "@/lib/date";
import { NOTICE_CATEGORIES } from "@/lib/labels";
import { getMember, getMemberSummary } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import { sortNotices } from "./NoticeList";

const LIST_HREF = "/dashboard/notices";

export function NoticeDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, update } = useData();
  const user = useCurrentUser();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const notice = data.notices.find((n) => n.id === id);

  const incrementViews = useCallback(
    (noticeId: string) =>
      update((prev) => ({
        ...prev,
        notices: prev.notices.map((n) => (n.id === noticeId ? { ...n, views: n.views + 1 } : n)),
      })),
    [update],
  );
  useCountViewOnce(id, !!notice, incrementViews);

  if (!notice) {
    return (
      <>
        <BackToList href={LIST_HREF} label="공지사항 목록" />
        <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />
      </>
    );
  }

  // 목록과 같은 정렬 기준에서 앞(이전글 = 더 위) / 뒤(다음글 = 더 아래)
  const ordered = sortNotices(data.notices);
  const index = ordered.findIndex((n) => n.id === notice.id);
  const prev = ordered[index - 1];
  const next = ordered[index + 1];
  const author = getMember(data, notice.authorId);

  const handleDelete = () => {
    update((p) => ({ ...p, notices: p.notices.filter((n) => n.id !== notice.id) }));
    router.replace(LIST_HREF);
  };

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
              name={author?.name ?? "알 수 없음"}
              color={author?.color}
              caption={getMemberSummary(data, notice.authorId)}
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
            <Button $variant="danger" $size="sm" onClick={() => setConfirmOpen(true)}>
              <Trash2 />
              삭제
            </Button>
          </ArticleActions>
        )}
      </Card>

      <AdjacentNav basePath={LIST_HREF} prev={prev} next={next} />

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
