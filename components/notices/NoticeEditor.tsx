"use client";

import { useRouter } from "next/navigation";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { BackToList, NotFoundArticle } from "@/components/articles/ArticleView";
import { AccessDenied, PageHeader } from "@/components/ui";
import { createId } from "@/lib/id";
import { NOTICE_CATEGORIES } from "@/lib/labels";
import type { ArticleFormValues } from "@/lib/schemas/article";
import { useCurrentUser, useData } from "@/lib/store";
import type { NoticeCategory } from "@/lib/types";

const LIST_HREF = "/dashboard/notices";

const categories = (Object.keys(NOTICE_CATEGORIES) as NoticeCategory[]).map((value) => ({
  value,
  label: NOTICE_CATEGORIES[value].label,
}));

/** 공지 작성(id 없음) / 수정(id 있음). 매니저 전용 */
export function NoticeEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { data, update } = useData();
  const user = useCurrentUser();
  const notice = id ? data.notices.find((n) => n.id === id) : undefined;
  const title = id ? "공지 수정" : "공지 작성";

  if (!user.isManager) {
    return (
      <>
        <PageHeader title={title} />
        <AccessDenied message="공지사항 작성·수정은 매니저만 할 수 있습니다." />
      </>
    );
  }

  if (id && !notice) {
    return <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />;
  }

  const handleSubmit = (values: ArticleFormValues<NoticeCategory>) => {
    const now = new Date().toISOString();
    if (notice) {
      update((prev) => ({
        ...prev,
        notices: prev.notices.map((n) =>
          n.id === notice.id ? { ...n, ...values, updatedAt: now } : n,
        ),
      }));
      router.push(`${LIST_HREF}/${notice.id}`);
      return;
    }
    const newId = createId("n");
    update((prev) => ({
      ...prev,
      notices: [
        { id: newId, ...values, authorId: user.id, createdAt: now, updatedAt: now, views: 0 },
        ...prev.notices,
      ],
    }));
    router.push(`${LIST_HREF}/${newId}`);
  };

  return (
    <>
      <BackToList
        href={notice ? `${LIST_HREF}/${notice.id}` : LIST_HREF}
        label={notice ? "공지로 돌아가기" : "공지사항 목록"}
      />
      <PageHeader title={title} description="전 직원에게 공개되는 공지사항입니다." />
      <ArticleForm
        initial={{
          title: notice?.title ?? "",
          category: notice?.category ?? "general",
          content: notice?.content ?? "",
          pinned: notice?.pinned ?? false,
        }}
        categories={categories}
        showPinned
        submitLabel={notice ? "수정 완료" : "등록"}
        cancelHref={notice ? `${LIST_HREF}/${notice.id}` : LIST_HREF}
        onSubmit={handleSubmit}
      />
    </>
  );
}
