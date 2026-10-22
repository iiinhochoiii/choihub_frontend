import { defaultInstance } from "../defaultInstance";
import type {
  CreateMemberRequest,
  CreateMemberResponse,
  Member,
  UpdateMemberRequest,
  UpdateProfileRequest,
} from "@/types";

export const membersService = {
  getList: () => defaultInstance.get<Member[]>("/members").then((r) => r.data),

  get: (id: string) => defaultInstance.get<Member>(`/members/${id}`).then((r) => r.data),

  /** 내 정보: 연락처·근무 상태 */
  updateProfile: (body: UpdateProfileRequest) =>
    defaultInstance.patch<Member>("/members/me", body).then((r) => r.data),

  /** 매니저: 초기 비밀번호가 함께 온다. */
  create: (body: CreateMemberRequest) =>
    defaultInstance.post<CreateMemberResponse>("/members", body).then((r) => r.data),

  /** 매니저 */
  update: (id: string, body: UpdateMemberRequest) =>
    defaultInstance.patch<Member>(`/members/${id}`, body).then((r) => r.data),

  /** 매니저: 기록 보존 삭제. 결재선에 지정돼 있으면 409 */
  remove: (id: string) => defaultInstance.delete<void>(`/members/${id}`).then(() => undefined),
};
