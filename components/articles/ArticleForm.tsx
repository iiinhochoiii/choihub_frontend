"use client";

import styled from "@emotion/styled";
import { useState } from "react";
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

export interface ArticleFormValues<C extends string> {
  title: string;
  category: C;
  content: string;
  pinned: boolean;
}

interface ArticleFormProps<C extends string> {
  initial: ArticleFormValues<C>;
  categories: { value: C; label: string }[];
  /** 공지사항의 상단 고정 옵션 노출 여부 */
  showPinned?: boolean;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: ArticleFormValues<C>) => void;
}

const TITLE_MAX = 100;

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
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);

  const titleError = !values.title.trim()
    ? "제목을 입력하세요."
    : values.title.length > TITLE_MAX
      ? `제목은 ${TITLE_MAX}자 이내로 입력하세요.`
      : undefined;
  const contentError = !values.content.trim() ? "내용을 입력하세요." : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (titleError || contentError) return;
    onSubmit({ ...values, title: values.title.trim(), content: values.content.trim() });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <Stack $gap={18}>
          <Row $gap={16} style={{ alignItems: "flex-start" }}>
            <CategoryField>
              <Field label="분류" required>
                {(id) => (
                  <Select
                    id={id}
                    value={values.category}
                    onChange={(e) => setValues((v) => ({ ...v, category: e.target.value as C }))}
                  >
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
              <Field
                label="제목"
                required
                error={submitted ? titleError : undefined}
                hint={`${values.title.length}/${TITLE_MAX}`}
              >
                {(id) => (
                  <Input
                    id={id}
                    value={values.title}
                    placeholder="제목을 입력하세요"
                    aria-invalid={submitted && !!titleError}
                    onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          </Row>

          {showPinned && (
            <CheckboxLabel>
              <input
                type="checkbox"
                checked={values.pinned}
                onChange={(e) => setValues((v) => ({ ...v, pinned: e.target.checked }))}
              />
              목록 상단에 고정
            </CheckboxLabel>
          )}

          <Field label="내용" required error={submitted ? contentError : undefined}>
            {(id) => (
              <ContentArea
                id={id}
                value={values.content}
                placeholder="내용을 입력하세요"
                aria-invalid={submitted && !!contentError}
                onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))}
              />
            )}
          </Field>

          <Row $justify="flex-end">
            <ButtonLink href={cancelHref} $variant="secondary">
              취소
            </ButtonLink>
            <Button type="submit">{submitLabel}</Button>
          </Row>
        </Stack>
      </Card>
    </form>
  );
}
