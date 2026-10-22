import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/apis/defaultInstance";

/**
 * 서버 검증 오류(errors: { "company.email": "..." })를 react-hook-form 필드 오류로 옮긴다.
 * 폼 필드 이름과 서버 필드 경로가 다르면 mapField로 바꾼다. 하나라도 옮겼으면 true.
 */
export function setServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  mapField: (path: string) => string | undefined = (path) => path,
): boolean {
  if (!(error instanceof ApiError)) return false;
  let applied = false;
  for (const [path, message] of Object.entries(error.fieldErrors)) {
    const field = mapField(path);
    if (!field) continue;
    setError(field as FieldPath<T>, { message }, { shouldFocus: !applied });
    applied = true;
  }
  return applied;
}
