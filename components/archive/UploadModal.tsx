"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Upload } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { getErrorMessage } from "@/apis/defaultInstance";
import { Button, Field, Modal, Notice, Select, Stack, Textarea } from "@/components/ui";
import { setServerErrors } from "@/lib/form";
import { FILE_DESCRIPTION_MAX, type UploadFormValues, uploadSchema } from "@/lib/schemas/archive";
import { useUploadArchiveFile } from "@/queries/archive";
import type { ArchiveFolder } from "@/types";
import { formatFileSize, MAX_STORED_FILE_SIZE } from "./format";

const DropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 16px;
  border: 1.5px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover,
  &:focus-within {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 24px;
    height: 24px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  strong {
    font-weight: 600;
    overflow-wrap: anywhere;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
`;

const ErrorText = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

interface UploadModalProps {
  open: boolean;
  folders: ArchiveFolder[];
  defaultFolderId: string;
  onClose: () => void;
}

export function UploadModal({ open, folders, defaultFolderId, onClose }: UploadModalProps) {
  const uploadFile = useUploadArchiveFile();
  const [formError, setFormError] = useState("");
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    // 파일은 선택 전까지 비워 둔다.
    defaultValues: { folderId: defaultFolderId ?? "", description: "" },
  });
  const file = useWatch({ control, name: "file" });

  const tooLarge = !!file && file.size > MAX_STORED_FILE_SIZE;

  const handleClose = () => {
    // 선택한 폴더는 유지하고 파일·설명만 비운다.
    reset({ folderId: getValues("folderId"), description: "" });
    setFormError("");
    onClose();
  };

  // 1MB 초과 파일의 내용 보관 여부는 서버가 정한다(응답의 hasContent).
  const submit = handleSubmit((values) => {
    setFormError("");
    uploadFile.mutate(values, {
      onSuccess: handleClose,
      onError: (error) => {
        if (!setServerErrors(error, setError)) setFormError(getErrorMessage(error));
      },
    });
  });

  return (
    <Modal
      open={open}
      title="파일 업로드"
      onClose={handleClose}
      footer={
        <>
          <Button $variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={submit} disabled={uploadFile.isPending}>
            {uploadFile.isPending ? "업로드 중..." : "업로드"}
          </Button>
        </>
      }
    >
      <Stack $gap={16}>
        <div>
          <DropZone>
            <Upload />
            <strong>{file ? file.name : "클릭해서 파일 선택"}</strong>
            <small>{file ? formatFileSize(file.size) : "모든 형식의 파일을 올릴 수 있습니다."}</small>
            <Controller
              control={control}
              name="file"
              render={({ field: { name, ref, onBlur, onChange } }) => (
                <input
                  ref={ref}
                  type="file"
                  name={name}
                  aria-label="업로드할 파일"
                  onBlur={onBlur}
                  onChange={(e) => onChange(e.target.files?.[0])}
                />
              )}
            />
          </DropZone>
          {errors.file && <ErrorText>{errors.file.message}</ErrorText>}
        </div>

        {tooLarge && (
          <Notice $tone="warning" style={{ marginBottom: 0 }}>
            <Info />
            <span>
              {formatFileSize(MAX_STORED_FILE_SIZE)} 이하 파일만 내용이 저장됩니다. 이 파일은
              이름·크기 등 정보만 등록되며 다운로드할 수 없습니다.
            </span>
          </Notice>
        )}

        <Field label="폴더" required error={errors.folderId?.message}>
          {(id) => (
            <Select id={id} aria-invalid={!!errors.folderId} {...register("folderId")}>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="설명" error={errors.description?.message}>
          {(id) => (
            <Textarea
              id={id}
              style={{ minHeight: 80 }}
              placeholder="파일에 대한 간단한 설명 (선택)"
              maxLength={FILE_DESCRIPTION_MAX}
              {...register("description")}
            />
          )}
        </Field>

        {formError && <ErrorText role="alert">{formError}</ErrorText>}
      </Stack>
    </Modal>
  );
}
