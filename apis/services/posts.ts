import { defaultInstance } from "../defaultInstance";
import type {
  BoardComment,
  CreateCommentRequest,
  CreatePostRequest,
  Post,
  PostDetail,
  PostListParams,
  PostPage,
  ToggleLikeResponse,
  UpdatePostRequest,
  ViewCountResponse,
} from "@/types";

export const postsService = {
  getList: (params?: PostListParams) =>
    defaultInstance.get<PostPage>("/posts", { params: { ...params, q: params?.q || undefined } }).then((r) => r.data),

  get: (id: string) => defaultInstance.get<PostDetail>(`/posts/${id}`).then((r) => r.data),

  /** 조회수 1 증가 */
  view: (id: string) => defaultInstance.post<ViewCountResponse>(`/posts/${id}/view`).then((r) => r.data),

  create: (body: CreatePostRequest) => defaultInstance.post<Post>("/posts", body).then((r) => r.data),

  /** 작성자 */
  update: (id: string, body: UpdatePostRequest) =>
    defaultInstance.patch<Post>(`/posts/${id}`, body).then((r) => r.data),

  /** 작성자 또는 매니저 */
  remove: (id: string) => defaultInstance.delete<void>(`/posts/${id}`).then(() => undefined),

  toggleLike: (id: string) => defaultInstance.post<ToggleLikeResponse>(`/posts/${id}/like`).then((r) => r.data),

  addComment: (id: string, body: CreateCommentRequest) =>
    defaultInstance.post<BoardComment>(`/posts/${id}/comments`, body).then((r) => r.data),

  /** 작성자 또는 매니저 */
  removeComment: (id: string, commentId: string) =>
    defaultInstance.delete<void>(`/posts/${id}/comments/${commentId}`).then(() => undefined),
};
