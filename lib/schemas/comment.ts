import { z } from "zod";

export const COMMENT_MAX = 500;

export const commentSchema = z.object({
  content: z.string().trim().min(1, "댓글을 입력하세요.").max(COMMENT_MAX),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
