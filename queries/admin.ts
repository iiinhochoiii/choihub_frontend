"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompanyInfoRequest, CreateTenantRequest, ManagerAccountRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { adminService } from "@/apis/services/admin";

export function useTenants(q?: string) {
  return useQuery({
    queryKey: queryKeys.admin.tenants(q),
    queryFn: () => adminService.getTenants(q),
    placeholderData: keepPreviousData,
  });
}

export function useTenant(id: string) {
  return useQuery({ queryKey: queryKeys.admin.tenant(id), queryFn: () => adminService.getTenant(id) });
}

/** 회사 상세가 바뀌는 변경: 상세 캐시를 응답으로 바꾸고 목록은 다시 조회한다. */
function useTenantMutation<TVariables>(mutationFn: (variables: TVariables) => ReturnType<typeof adminService.getTenant>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (tenant) => {
      queryClient.setQueryData(queryKeys.admin.tenant(tenant.id), tenant);
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTenantRequest) => adminService.createTenant(body),
    onSuccess: ({ tenant }) => {
      queryClient.setQueryData(queryKeys.admin.tenant(tenant.id), tenant);
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.all });
    },
  });
}

export function useUpdateTenantCompany() {
  return useTenantMutation(({ id, body }: { id: string; body: CompanyInfoRequest }) =>
    adminService.updateCompany(id, body),
  );
}

export function useSuspendTenant() {
  return useTenantMutation((id: string) => adminService.suspend(id));
}

export function useActivateTenant() {
  return useTenantMutation((id: string) => adminService.activate(id));
}

export function useAddManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ManagerAccountRequest }) => adminService.addManager(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });
}

export function useResetManagerPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, memberId }: { id: string; memberId: string }) => adminService.resetManagerPassword(id, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.admin.all }),
  });
}
