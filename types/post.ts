import type { AdjacentArticle, ISODateString, Page } from "./common";

export type PostCategory = "free" | "question" | "info" | "club";

export interface BoardComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: ISODateString;
}

interface PostBase {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  category: PostCategory;
  views: number;
}

/** 목록 행: 좋아요·댓글은 개수만 */
export interface PostListItem extends PostBase {
  likeCount: number;
  commentCount: number;
  /** 내가 좋아요를 눌렀는지 */
  liked: boolean;
}

export interface Post extends PostBase {
  /** 좋아요한 memberId 목록 */
  likes: string[];
  /** 작성 순 */
  comments: BoardComment[];
}

export interface PostDetail extends Post {
  prev: AdjacentArticle | null;
  next: AdjacentArticle | null;
}

export interface PostListParams {
  page?: number;
  category?: PostCategory;
  q?: string;
}

export interface PostPage extends Page<PostListItem> {
  categoryCounts: Record<"all" | PostCategory, number>;
}

export interface CreatePostRequest {
  title: string;
  category: PostCategory;
  content: string;
}

export type UpdatePostRequest = Partial<CreatePostRequest>;

export interface ToggleLikeResponse {
  liked: boolean;
  likeCount: number;
}

export interface CreateCommentRequest {
  content: string;
}
