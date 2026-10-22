import { z } from "zod";

export const TITLE_MAX = 100;

/** 공지사항·게시판 공용 작성 폼. 분류 목록은 화면마다 달라 인자로 받는다. */
export function createArticleSchema(categories: readonly string[]) {
  return z.object({
    // 길이 제한은 입력값 그대로(공백 포함) 검사한 뒤 앞뒤 공백을 제거한다.
    title: z.string().max(TITLE_MAX, `제목은 ${TITLE_MAX}자 이내로 입력하세요.`).trim().min(1, "제목을 입력하세요."),
    category: z.enum(categories as [string, ...string[]]),
    content: z.string().trim().min(1, "내용을 입력하세요."),
    pinned: z.boolean(),
  });
}

/** C: 화면별 분류 타입 (스키마가 분류 목록으로 검사하므로 좁혀서 쓸 수 있다) */
export type ArticleFormValues<C extends string = string> = Omit<
  z.infer<ReturnType<typeof createArticleSchema>>,
  "category"
> & { category: C };
