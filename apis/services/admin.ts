import { defaultInstance } from "../defaultInstance";
import type {
  AddManagerResponse,
  CompanyInfoRequest,
  CreateTenantRequest,
  CreateTenantResponse,
  ManagerAccountRequest,
  ResetPasswordResponse,
  TenantDetail,
  TenantListResponse,
} from "@/types";

/** 운영 콘솔: 회사(테넌트) 계정 관리 (운영자 전용) */
export const adminService = {
  getTenants: (q?: string) =>
    defaultInstance.get<TenantListResponse>("/admin/tenants", { params: { q: q || undefined } }).then((r) => r.data),

  getTenant: (id: string) => defaultInstance.get<TenantDetail>(`/admin/tenants/${id}`).then((r) => r.data),

  createTenant: (body: CreateTenantRequest) =>
    defaultInstance.post<CreateTenantResponse>("/admin/tenants", body).then((r) => r.data),

  updateCompany: (id: string, body: CompanyInfoRequest) =>
    defaultInstance.patch<TenantDetail>(`/admin/tenants/${id}/company`, body).then((r) => r.data),

  suspend: (id: string) => defaultInstance.post<TenantDetail>(`/admin/tenants/${id}/suspend`).then((r) => r.data),

  activate: (id: string) => defaultInstance.post<TenantDetail>(`/admin/tenants/${id}/activate`).then((r) => r.data),

  addManager: (id: string, body: ManagerAccountRequest) =>
    defaultInstance.post<AddManagerResponse>(`/admin/tenants/${id}/managers`, body).then((r) => r.data),

  resetManagerPassword: (id: string, memberId: string) =>
    defaultInstance
      .post<ResetPasswordResponse>(`/admin/tenants/${id}/managers/${memberId}/reset-password`)
      .then((r) => r.data),
};
