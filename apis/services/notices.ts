import { defaultInstance } from "../defaultInstance";
import type {
  CreateNoticeRequest,
  Notice,
  NoticeDetail,
  NoticeListParams,
  NoticePage,
  UpdateNoticeRequest,
  ViewCountResponse,
} from "@/types";

export const noticesService = {
  getList: (params?: NoticeListParams) =>
    defaultInstance.get<NoticePage>("/notices", { params: { ...params, q: params?.q || undefined } }).then((r) => r.data),

  get: (id: string) => defaultInstance.get<NoticeDetail>(`/notices/${id}`).then((r) => r.data),

  /** 조회수 1 증가 */
  view: (id: string) => defaultInstance.post<ViewCountResponse>(`/notices/${id}/view`).then((r) => r.data),

  /** 매니저 */
  create: (body: CreateNoticeRequest) => defaultInstance.post<Notice>("/notices", body).then((r) => r.data),

  /** 매니저 */
  update: (id: string, body: UpdateNoticeRequest) =>
    defaultInstance.patch<Notice>(`/notices/${id}`, body).then((r) => r.data),

  /** 매니저 */
  remove: (id: string) => defaultInstance.delete<void>(`/notices/${id}`).then(() => undefined),
};
