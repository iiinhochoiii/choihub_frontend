"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  ButtonLink,
  Button,
  Card,
  CheckboxLabel,
  Field,
  Input,
  Row,
  Select,
  Stack,
  Textarea,
} from "@/components/ui";
import { setServerErrors } from "@/lib/form";
import { type ArticleFormValues, createArticleSchema, TITLE_MAX } from "@/lib/schemas/article";

interface ArticleFormProps<C extends string> {
  initial: ArticleFormValues<C>;
  categories: { value: C; label: string }[];
  /** 공지사항의 상단 고정 옵션 노출 여부 */
  showPinned?: boolean;
  submitLabel: string;
  cancelHref: string;
  /** 저장 요청. 실패하면 던진 오류를 필드 오류 또는 폼 하단 메시지로 보여 준다. */
  onSubmit: (values: ArticleFormValues<C>) => Promise<unknown>;
}

const FormError = styled.p`
  flex: 1;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

const ContentArea = styled(Textarea)`
  min-height: 320px;
`;

const CategoryField = styled.div`
  width: 100%;

  @media (min-width: 640px) {
    width: 200px;
  }
`;

/** 공지사항·게시판 공용 작성/수정 폼 */
export function ArticleForm<C extends string>({
  initial,
  categories,
  showPinned,
  submitLabel,
  cancelHref,
  onSubmit,
}: ArticleFormProps<C>) {
  const schema = useMemo(() => createArticleSchema(categories.map((c) => c.value)), [categories]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });
  const title = useWatch({ control, name: "title" });
  const [formError, setFormError] = useState("");

  // 분류는 스키마가 categories로 검사하므로 C로 좁혀도 안전하다.
  const submit = handleSubmit(async (values) => {
    setFormError("");
    try {
      await onSubmit(values as ArticleFormValues<C>);
    } catch (error) {
      if (!setServerErrors(error, setError)) setFormError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={submit} noValidate>
      <Card>
        <Stack $gap={18}>
          <Row $gap={16} style={{ alignItems: "flex-start" }}>
            <CategoryField>
              <Field label="분류" required>
                {(id) => (
                  <Select id={id} {...register("category")}>
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </CategoryField>
            <div style={{ flex: 1, minWidth: 220 }}>
              <Field label="제목" required error={errors.title?.message} hint={`${title.length}/${TITLE_MAX}`}>
                {(id) => (
                  <Input id={id} placeholder="제목을 입력하세요" aria-invalid={!!errors.title} {...register("title")} />
                )}
              </Field>
            </div>
          </Row>

          {showPinned && (
            <CheckboxLabel>
              <input type="checkbox" {...register("pinned")} />
              목록 상단에 고정
            </CheckboxLabel>
          )}

          <Field label="내용" required error={errors.content?.message}>
            {(id) => (
              <ContentArea
                id={id}
                placeholder="내용을 입력하세요"
                aria-invalid={!!errors.content}
                {...register("content")}
              />
            )}
          </Field>

          <Row $justify="flex-end">
            {formError && <FormError role="alert">{formError}</FormError>}
            <ButtonLink href={cancelHref} $variant="secondary">
              취소
            </ButtonLink>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </Row>
        </Stack>
      </Card>
    </form>
  );
}
