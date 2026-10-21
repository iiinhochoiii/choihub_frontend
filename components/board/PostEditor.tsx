"use client";

import { useRouter } from "next/navigation";
import { ArticleForm, type ArticleFormValues } from "@/components/articles/ArticleForm";
import { BackToList, NotFoundArticle } from "@/components/articles/ArticleView";
import { AccessDenied, PageHeader } from "@/components/ui";
import { createId } from "@/lib/id";
import { POST_CATEGORIES } from "@/lib/labels";
import { useCurrentUser, useData } from "@/lib/store";
import type { PostCategory } from "@/lib/types";

const LIST_HREF = "/dashboard/board";

const categories = (Object.keys(POST_CATEGORIES) as PostCategory[]).map((value) => ({
  value,
  label: POST_CATEGORIES[value].label,
}));

/** 게시글 작성(id 없음) / 수정(id 있음, 작성자 본인만) */
export function PostEditor({ id }: { id?: string }) {
  const router = useRouter();
  const { data, update } = useData();
  const user = useCurrentUser();
  const post = id ? data.posts.find((p) => p.id === id) : undefined;
  const title = id ? "게시글 수정" : "글쓰기";

  if (id && !post) {
    return <NotFoundArticle listHref={LIST_HREF} label="목록으로 돌아가기" />;
  }

  if (post && post.authorId !== user.id) {
    return (
      <>
        <PageHeader title={title} />
        <AccessDenied message="게시글은 작성자 본인만 수정할 수 있습니다." />
      </>
    );
  }

  const handleSubmit = ({ title, category, content }: ArticleFormValues<PostCategory>) => {
    const now = new Date().toISOString();
    if (post) {
      update((prev) => ({
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === post.id ? { ...p, title, category, content, updatedAt: now } : p,
        ),
      }));
      router.push(`${LIST_HREF}/${post.id}`);
      return;
    }
    const newId = createId("p");
    update((prev) => ({
      ...prev,
      posts: [
        {
          id: newId,
          title,
          category,
          content,
          authorId: user.id,
          createdAt: now,
          updatedAt: now,
          views: 0,
          likes: [],
          comments: [],
        },
        ...prev.posts,
      ],
    }));
    router.push(`${LIST_HREF}/${newId}`);
  };

  const backHref = post ? `${LIST_HREF}/${post.id}` : LIST_HREF;

  return (
    <>
      <BackToList href={backHref} label={post ? "게시글로 돌아가기" : "게시판 목록"} />
      <PageHeader title={title} description="소속 직원 모두가 볼 수 있는 게시판입니다." />
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
