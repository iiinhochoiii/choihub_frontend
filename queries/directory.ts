"use client";

import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import * as selectors from "@/lib/selectors";
import type { CreateDepartmentRequest, CreateMemberRequest, UpdateMemberRequest, UpdateProfileRequest } from "@/types";
import { queryKeys } from "./queryKeys";
import { companyService } from "@/apis/services/company";
import { departmentsService } from "@/apis/services/departments";
import { membersService } from "@/apis/services/members";

/**
 * 구성원·부서·회사정보는 거의 모든 화면이 쓰므로 DashboardShell이 먼저 불러온 뒤 화면을 그린다.
 * 그래서 대시보드 하위에서는 아래 훅이 항상 데이터를 돌려준다(suspense 쿼리라 로딩 분기가 필요 없다).
 */
const DIRECTORY_STALE_TIME = 5 * 60 * 1000;

export const membersQuery = {
  queryKey: queryKeys.members.list,
  queryFn: membersService.getList,
  staleTime: DIRECTORY_STALE_TIME,
};

export const departmentsQuery = {
  queryKey: queryKeys.departments,
  queryFn: departmentsService.getList,
  staleTime: DIRECTORY_STALE_TIME,
};

export const companyQuery = {
  queryKey: queryKeys.company,
  queryFn: companyService.get,
  staleTime: DIRECTORY_STALE_TIME,
};

export function useMembers() {
  return useSuspenseQuery(membersQuery).data;
}

export function useDepartments() {
  return useSuspenseQuery(departmentsQuery).data;
}

export function useCompany() {
  return useSuspenseQuery(companyQuery).data;
}

/** DashboardShell용: 세 가지가 모두 준비됐는지 (suspense 없이 확인) */
export function useDirectoryStatus(enabled: boolean) {
  const members = useQuery({ ...membersQuery, enabled });
  const departments = useQuery({ ...departmentsQuery, enabled });
  const company = useQuery({ ...companyQuery, enabled });
  const queries = [members, departments, company];
  return {
    ready: queries.every((q) => q.isSuccess),
    error: queries.find((q) => q.error)?.error ?? null,
    refetch: () => queries.forEach((q) => void q.refetch()),
  };
}

/** 구성원·부서 목록과 이름 찾기 도우미 */
export function useDirectory() {
  const members = useMembers();
  const departments = useDepartments();
  return useMemo(
    () => ({
      members,
      departments,
      getMember: (id: string) => selectors.getMember(members, id),
      getMemberName: (id: string) => selectors.getMemberName(members, id),
      getMemberSummary: (id: string) => selectors.getMemberSummary(members, departments, id),
      getDepartment: (id: string) => selectors.getDepartment(departments, id),
      getDepartmentName: (id: string) => selectors.getDepartmentName(departments, id),
      getDepartmentTreeIds: (rootId: string) => selectors.getDepartmentTreeIds(departments, rootId),
    }),
    [members, departments],
  );
}

export function useMember(id: string) {
  return useQuery({ queryKey: queryKeys.members.detail(id), queryFn: () => membersService.get(id) });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: companyService.update,
    onSuccess: (company) => queryClient.setQueryData(queryKeys.company, company),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDepartmentRequest) => departmentsService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMemberRequest) => membersService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members.all }),
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateMemberRequest }) => membersService.update(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      // 본인의 권한·연차가 바뀌었을 수 있다.
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}

/**
 * 구성원 삭제(매니저, 기록 보존). 목록에서 빠지고 남은 기록에는 "삭제된 구성원"으로 표시된다.
 * 근태·휴가 화면도 구성원 목록을 기준으로 하므로 함께 다시 조회한다.
 */
export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.leave.all });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => membersService.updateProfile(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.members.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
}
