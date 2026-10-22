export interface Department {
  id: string;
  name: string;
  parentId: string | null;
}

export interface CreateDepartmentRequest {
  name: string;
  /** null이면 최상위 부서 */
  parentId: string | null;
}
