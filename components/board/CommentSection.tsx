"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { MessageCircle, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Avatar, Button, Card, IconButton, Textarea } from "@/components/ui";
import { formatRelative } from "@/lib/date";
import { setServerErrors } from "@/lib/form";
import { COMMENT_MAX, type CommentFormValues, commentSchema } from "@/lib/schemas/comment";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import { useAddComment, useDeleteComment } from "@/queries/posts";
import type { Post } from "@/types";
import { UNKNOWN_MEMBER_NAME } from "@/lib/selectors";

const Title = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 15px;
  font-weight: 700;

  svg {
    width: 18px;
    height: 18px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  span {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
`;

const Item = styled.li`
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:first-of-type {
    padding-top: 0;
  }
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    margin-bottom: 4px;
  }

  strong {
    font-size: 14px;
    font-weight: 600;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  p {
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
`;

const Empty = styled.p`
  padding: 12px 0 20px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const Composer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;

  textarea {
    min-height: 80px;
  }

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

const ErrorText = styled.p`
  margin-top: 8px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

export function CommentSection({ post }: { post: Post }) {
  const { getMember } = useDirectory();
  const user = useCurrentUser();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "" },
  });
  const content = useWatch({ control, name: "content" });

  const submit = handleSubmit(({ content: text }) =>
    addComment.mutate(
      { postId: post.id, content: text },
      {
        onSuccess: () => reset(),
        onError: (error) => {
          if (!setServerErrors(error, setError)) setError("content", { message: getErrorMessage(error) });
        },
      },
    ),
  );

  return (
    <Card $padding={24} style={{ marginTop: 16 }}>
      <Title>
        <MessageCircle />
        댓글 <span>{post.comments.length}</span>
      </Title>

      {post.comments.length === 0 ? (
        <Empty>아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</Empty>
      ) : (
        <List>
          {post.comments.map((comment) => {
            const author = getMember(comment.authorId);
            return (
              <Item key={comment.id}>
                <Avatar name={author?.name ?? "?"} color={author?.color} size={32} />
                <ItemBody>
                  <header>
                    <strong>{author?.name ?? UNKNOWN_MEMBER_NAME}</strong>
                    {author && <small>{author.position}</small>}
                    <small>· {formatRelative(comment.createdAt)}</small>
                  </header>
                  <p>{comment.content}</p>
                </ItemBody>
                {comment.authorId === user.id && (
                  <IconButton
                    $size={30}
                    aria-label="댓글 삭제"
                    disabled={deleteComment.isPending}
                    onClick={() => deleteComment.mutate({ postId: post.id, commentId: comment.id })}
                  >
                    <Trash2 />
                  </IconButton>
                )}
              </Item>
            );
          })}
        </List>
      )}
      {deleteComment.error && <ErrorText role="alert">{getErrorMessage(deleteComment.error)}</ErrorText>}

      <Composer onSubmit={submit}>
        <Textarea
          aria-label="댓글 입력"
          placeholder="댓글을 입력하세요"
          maxLength={COMMENT_MAX}
          aria-invalid={!!errors.content}
          {...register("content")}
        />
        {errors.content && <ErrorText role="alert">{errors.content.message}</ErrorText>}
        <div>
          <span>
            {content.length}/{COMMENT_MAX}
          </span>
          <Button type="submit" $size="sm" disabled={!content.trim() || addComment.isPending}>
            댓글 등록
          </Button>
        </div>
      </Composer>
    </Card>
  );
}
