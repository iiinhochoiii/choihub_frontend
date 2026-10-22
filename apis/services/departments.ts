import { defaultInstance } from "../defaultInstance";
import type { CreateDepartmentRequest, Department } from "@/types";

/** 부서는 추가만 할 수 있다. 목록은 트리 표시 순서(부모 → 자식)로 온다. */
export const departmentsService = {
  getList: () => defaultInstance.get<Department[]>("/departments").then((r) => r.data),

  /** 매니저 */
  create: (body: CreateDepartmentRequest) =>
    defaultInstance.post<Department>("/departments", body).then((r) => r.data),
};
