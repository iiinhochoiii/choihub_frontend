"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreatePostRequest, PostDetail, PostListParams, UpdatePostRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { postsService } from "@/apis/services/posts";

export function usePosts(params?: PostListParams) {
  return useQuery({
    queryKey: queryKeys.posts.list(params),
    queryFn: () => postsService.getList(params),
    placeholderData: keepPreviousData,
  });
}

export function usePost(id: string) {
  return useQuery({ queryKey: queryKeys.posts.detail(id), queryFn: () => postsService.get(id) });
}

/** 상세 캐시 일부만 고친다. */
function usePatchPostDetail() {
  const queryClient = useQueryClient();
  return (id: string, patch: (prev: PostDetail) => PostDetail) =>
    queryClient.setQueryData<PostDetail>(queryKeys.posts.detail(id), (prev) => (prev ? patch(prev) : prev));
}

export function useViewPost() {
  const patchDetail = usePatchPostDetail();
  return useMutation({
    mutationFn: (id: string) => postsService.view(id),
    onSuccess: ({ views }, id) => patchDetail(id, (prev) => ({ ...prev, views })),
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePostRequest) => postsService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePostRequest }) => postsService.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => postsService.remove(id),
    // 상세 화면이 아직 떠 있으므로 상세 캐시는 건드리지 않는다(다시 조회하면 404). 목록만 갱신한다.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", "list"] }),
  });
}

/** 좋아요 토글. 응답을 상세 캐시에 반영하고 목록(개수)은 다시 조회한다. */
export function useTogglePostLike(memberId: string) {
  const queryClient = useQueryClient();
  const patchDetail = usePatchPostDetail();
  return useMutation({
    mutationFn: (id: string) => postsService.toggleLike(id),
    onSuccess: ({ liked }, id) => {
      patchDetail(id, (prev) => ({
        ...prev,
        likes: liked ? [...prev.likes.filter((m) => m !== memberId), memberId] : prev.likes.filter((m) => m !== memberId),
      }));
      void queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const patchDetail = usePatchPostDetail();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      postsService.addComment(postId, { content }),
    onSuccess: (comment, { postId }) => {
      patchDetail(postId, (prev) => ({ ...prev, comments: [...prev.comments, comment] }));
      void queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  const patchDetail = usePatchPostDetail();
  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      postsService.removeComment(postId, commentId),
    onSuccess: (_, { postId, commentId }) => {
      patchDetail(postId, (prev) => ({ ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }));
      void queryClient.invalidateQueries({ queryKey: ["posts", "list"] });
    },
  });
}
