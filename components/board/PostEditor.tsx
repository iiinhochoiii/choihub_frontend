"use client";

import { useRouter } from "next/navigation";
import { getErrorMessage } from "@/apis/defaultInstance";
import { ArticleForm } from "@/components/articles/ArticleForm";
import { BackToList, isNotFoundError, NotFoundArticle } from "@/components/articles/ArticleView";
import { AccessDenied, ErrorState, LoadingState, PageHeader } from "@/components/ui";
import { POST_CATEGORIES } from "@/lib/labels";
import type { ArticleFormValues } from "@/lib/schemas/article";
import { useCurrentUser } from "@/queries/auth";
import { useCreatePost, usePost, useUpdatePost } from "@/queries/posts";
import type { Post, PostCategory } from "@/types";

const LIST_HREF = "/dashboard/board";

const categories = (Object.keys(POST_CATEGORIES) as PostCategory[]).map((value) => ({
  value,
  label: POST_CATEGORIES[value].label,
}));

/** 게시글 작성(id 없음) / 수정(id 있음, 작성자 본인만 — 서버도 403으로 막는다) */
export function PostEditor({ id }: { id?: string }) {
  return id ? <PostEditLoader id={id} /> : <PostEditorForm />;
}

/** 수정할 글을 불러온 뒤 폼을 그린다. */
function PostEditLoader({ id }: { id: string }) {
  const user = useCurrentUser();
  const { data: post, isPending, error, refetch } = usePost(id);

  if (isPending) return <LoadingState />;
  if (error) {
    return isNotFoundError(error) ? (
      <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />
    ) : (
      <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
    );
  }

  if (post.authorId !== user.id) {
    return (
      <>
        <PageHeader title="게시글 수정" />
        <AccessDenied message="게시글은 작성자 본인만 수정할 수 있습니다." />
      </>
    );
  }

  return <PostEditorForm post={post} />;
}

function PostEditorForm({ post }: { post?: Post }) {
  const router = useRouter();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();

  // 오류는 ArticleForm이 필드 오류/폼 메시지로 보여 준다.
  const handleSubmit = async ({ title, category, content }: ArticleFormValues<PostCategory>) => {
    const body = { title, category, content };
    if (post) {
      await updatePost.mutateAsync({ id: post.id, body });
      router.push(`${LIST_HREF}/${post.id}`);
      return;
    }
    const created = await createPost.mutateAsync(body);
    router.push(`${LIST_HREF}/${created.id}`);
  };

  const backHref = post ? `${LIST_HREF}/${post.id}` : LIST_HREF;

  return (
    <>
      <BackToList href={backHref} label={post ? "게시글로 돌아가기" : "게시판 목록"} />
      <PageHeader
        title={post ? "게시글 수정" : "글쓰기"}
        description="소속 직원 모두가 볼 수 있는 게시판입니다."
      />
      <ArticleForm
        initial={{
          title: post?.title ?? "",
          category: post?.category ?? "free",
          content: post?.content ?? "",
          pinned: false,
        }}
        categories={categories}
        submitLabel={post ? "수정 완료" : "등록"}
        cancelHref={backHref}
        onSubmit={handleSubmit}
      />
    </>
  );
}
