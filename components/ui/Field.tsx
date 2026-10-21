"use client";

import { css, type Theme } from "@emotion/react";
import styled from "@emotion/styled";
import { useId } from "react";

const controlStyles = ({ theme }: { theme: Theme }) => css`
  width: 100%;
  min-width: 0;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.md};
  background: ${theme.colors.surface};
  color: ${theme.colors.text};
  font-size: 14px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;

  &::placeholder {
    color: ${theme.colors.textSubtle};
  }

  &:hover:not(:disabled):not(:read-only) {
    border-color: ${theme.colors.borderStrong};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primarySoft};
  }

  &:disabled,
  &:read-only {
    background: ${theme.colors.surfaceMuted};
    color: ${theme.colors.textMuted};
  }

  &[aria-invalid="true"] {
    border-color: ${theme.colors.danger};
  }
`;

export const Input = styled.input`
  ${controlStyles}
  height: 38px;
  padding: 0 12px;
`;

export const Select = styled.select`
  ${controlStyles}
  height: 38px;
  padding: 0 32px 0 12px;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2398a2b3' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;

  &:read-only {
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const Textarea = styled.textarea`
  ${controlStyles}
  min-height: 120px;
  padding: 10px 12px;
  resize: vertical;
  line-height: 1.6;
`;

const FieldWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};

  em {
    margin-left: 2px;
    font-style: normal;
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const Hint = styled.p<{ error?: boolean }>`
  font-size: 12px;
  color: ${({ theme, error }) => (error ? theme.colors.danger : theme.colors.textSubtle)};
`;

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  /** id를 받아 컨트롤에 연결한다. */
  children: (id: string) => React.ReactNode;
}

export function Field({ label, required, hint, error, children }: FieldProps) {
  const id = useId();
  return (
    <FieldWrap>
      <Label htmlFor={id}>
        {label}
        {required && <em>*</em>}
      </Label>
      {children(id)}
      {error ? <Hint error>{error}</Hint> : hint ? <Hint>{hint}</Hint> : null}
    </FieldWrap>
  );
}

/** 폼 필드를 1열(모바일) / 2열(데스크톱)로 배치 */
export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  & > [data-span="full"] {
    grid-column: 1 / -1;
  }
`;

export const CheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  user-select: none;

  input {
    width: 16px;
    height: 16px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`;

export const SearchInput = styled(Input)`
  padding-left: 36px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2398a2b3' stroke-width='2' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='7'/%3E%3Cpath d='m20 20-3.5-3.5'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: 12px center;
`;
