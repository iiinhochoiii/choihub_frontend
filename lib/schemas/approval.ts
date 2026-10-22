import { z } from "zod";
import type { FormField } from "@/lib/types";

/** 결재 문서 기안. 입력 항목은 양식마다 달라 양식 정의로 스키마를 만든다. */
export function createApprovalDraftSchema(fields: FormField[]) {
  return z.object({
    title: z.string().trim().min(1, "제목을 입력하세요."),
    // 항목 값은 입력한 그대로 저장하고, 필수 여부만 공백 제외로 검사한다.
    values: z.object(
      Object.fromEntries(
        fields.map((field) => [
          field.id,
          field.required
            ? z.string().refine((v) => v.trim().length > 0, `${field.label}을(를) 입력하세요.`)
            : z.string(),
        ]),
      ),
    ),
  });
}

export type ApprovalDraftFormValues = z.infer<ReturnType<typeof createApprovalDraftSchema>>;

/** 결재 처리(승인/반려). 반려 시에는 의견이 필수다. */
export const approvalDecisionSchema = z
  .object({
    decision: z.enum(["approved", "rejected"]),
    comment: z.string().trim(),
  })
  .refine((v) => v.decision !== "rejected" || v.comment.length > 0, {
    path: ["comment"],
    message: "반려 시 의견을 입력해야 합니다.",
  });

export type ApprovalDecisionFormValues = z.infer<typeof approvalDecisionSchema>;

const formFieldSchema = z.object({
  id: z.string(),
  label: z.string().trim().min(1, "모든 입력 항목의 이름을 입력하세요."),
  type: z.enum(["text", "textarea", "number", "date"]),
  required: z.boolean(),
  placeholder: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined),
});

/** 결재 양식(템플릿) 편집 */
export const approvalFormSchema = z.object({
  name: z.string().trim().min(1, "양식 이름을 입력하세요."),
  category: z.string().trim().min(1, "카테고리를 입력하세요."),
  description: z.string().trim(),
  fields: z.array(formFieldSchema).min(1, "입력 항목을 1개 이상 추가하세요."),
  approverIds: z.array(z.string()).min(1, "결재자를 1명 이상 지정하세요."),
});

export type ApprovalFormInput = z.input<typeof approvalFormSchema>;
export type ApprovalFormValues = z.output<typeof approvalFormSchema>;
