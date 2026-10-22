"use client";

import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/apis/defaultInstance";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { BackToList, isNotFoundError, NotFoundArticle } from "@/components/articles/ArticleView";
import { AccessDenied, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { NOTICE_CATEGORIES } from "@/lib/labels";
import type { ArticleFormValues } from "@/lib/schemas/article";
import { useCurrentUser } from "@/queries/auth";
import { useCreateNotice, useNotice, useUpdateNotice } from "@/queries/notices";
import type { Notice, NoticeCategory } from "@/types";

const LIST_HREF = "/dashboard/notices";

const categories = (Object.keys(NOTICE_CATEGORIES) as NoticeCategory[]).map((value) => ({
  value,
  label: NOTICE_CATEGORIES[value].label,
}));

/** 공지 작성(id 없음) / 수정(id 있음). 매니저 전용 (서버도 403으로 막는다) */
export function NoticeEditor({ id }: { id?: string }) {
  const user = useCurrentUser();
  const title = id ? "공지 수정" : "공지 작성";

  if (!user.isManager) {
    return (
      <>
        <PageHeader title={title} />
        <AccessDenied message="공지사항 작성·수정은 매니저만 할 수 있습니다." />
      </>
    );
  }

  return id ? <NoticeEditLoader id={id} /> : <NoticeEditorForm />;
}

/** 수정할 공지를 불러온 뒤 폼을 그린다. */
function NoticeEditLoader({ id }: { id: string }) {
  const { data: notice, isPending, error, refetch } = useNotice(id);

  if (isPending) return <LoadingState />;
  if (error) {
    return isNotFoundError(error) ? (
      <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />
    ) : (
      <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
    );
  }
  return <NoticeEditorForm notice={notice} />;
}

function NoticeEditorForm({ notice }: { notice?: Notice }) {
  const router = useRouter();
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();

  // 오류는 ArticleForm이 필드 오류/폼 메시지로 보여 준다.
  const handleSubmit = async (values: ArticleFormValues<NoticeCategory>) => {
    if (notice) {
      await updateNotice.mutateAsync({ id: notice.id, body: values });
      router.push(`${LIST_HREF}/${notice.id}`);
      return;
    }
    const created = await createNotice.mutateAsync(values);
    router.push(`${LIST_HREF}/${created.id}`);
  };

  return (
    <>
      <BackToList
        href={notice ? `${LIST_HREF}/${notice.id}` : LIST_HREF}
        label={notice ? "공지로 돌아가기" : "공지사항 목록"}
      />
      <PageHeader title={notice ? "공지 수정" : "공지 작성"} description="전 직원에게 공개되는 공지사항입니다." />
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
