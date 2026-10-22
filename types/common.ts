/** 서버 날짜(Date)는 JSON에서 ISO 문자열로 온다. */
export type ISODateString = string;

/** 서버 오류 응답 본문. errors는 필드 경로("company.email" 등) → 메시지 */
export interface ApiErrorBody {
  statusCode: number;
  message: string;
  errors?: Record<string, string>;
}

/** 공지·게시판 목록 페이지 */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 상세 화면의 이전/다음 글 */
export interface AdjacentArticle {
  id: string;
  title: string;
}

/** 초기 비밀번호 발급 결과. 발급 응답에서 한 번만 평문으로 내려온다. */
export interface Credential {
  email: string;
  password: string;
}
