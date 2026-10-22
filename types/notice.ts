import type { AdjacentArticle, ISODateString, Page } from "./common";

export type NoticeCategory = "general" | "hr" | "event" | "system";

export interface Notice {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  pinned: boolean;
  category: NoticeCategory;
  views: number;
}

export interface NoticeListParams {
  page?: number;
  category?: NoticeCategory;
  q?: string;
}

export interface NoticePage extends Page<Notice> {
  /** 분류 칩 개수. 검색어·분류 필터와 무관하게 회사 전체 기준 */
  categoryCounts: Record<"all" | NoticeCategory, number>;
}

export interface NoticeDetail extends Notice {
  /** 목록 정렬 기준 바로 앞(위) 글 */
  prev: AdjacentArticle | null;
  /** 목록 정렬 기준 바로 뒤(아래) 글 */
  next: AdjacentArticle | null;
}

export interface CreateNoticeRequest {
  title: string;
  category: NoticeCategory;
  content: string;
  pinned?: boolean;
}

export type UpdateNoticeRequest = Partial<CreateNoticeRequest>;

export interface ViewCountResponse {
  views: number;
}
