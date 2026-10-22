"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Upload } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button, Field, Modal, Notice, Select, Stack, Textarea } from "@/components/ui";
import { createId } from "@/lib/id";
import { FILE_DESCRIPTION_MAX, type UploadFormValues, uploadSchema } from "@/lib/schemas/archive";
import { useCurrentUser, useData } from "@/lib/store";
import type { ArchiveFile } from "@/lib/types";
import { formatFileSize, MAX_STORED_FILE_SIZE, readAsDataUrl } from "./format";

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
  defaultFolder: string;
  onClose: () => void;
}

export function UploadModal({ open, defaultFolder, onClose }: UploadModalProps) {
  const { data, update } = useData();
  const user = useCurrentUser();
  const {
    register,
    control,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    // 파일은 선택 전까지 비워 둔다.
    defaultValues: { folder: defaultFolder ?? "", description: "" },
  });
  const file = useWatch({ control, name: "file" });

  const tooLarge = !!file && file.size > MAX_STORED_FILE_SIZE;

  const handleClose = () => {
    // 선택한 폴더는 유지하고 파일·설명만 비운다.
    reset({ folder: getValues("folder"), description: "" });
    onClose();
  };

  const submit = handleSubmit(async ({ file, folder, description }) => {
    let dataUrl: string | undefined;
    if (file.size <= MAX_STORED_FILE_SIZE) {
      try {
        dataUrl = await readAsDataUrl(file);
      } catch {
        dataUrl = undefined;
      }
    }
    const entry: ArchiveFile = {
      id: createId("file"),
      name: file.name,
      folder,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
      uploaderId: user.id,
      uploadedAt: new Date().toISOString(),
      description,
      dataUrl,
    };
    update((prev) => ({ ...prev, archiveFiles: [entry, ...prev.archiveFiles] }));
    handleClose();
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
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? "업로드 중..." : "업로드"}
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
              데모 환경에서는 {formatFileSize(MAX_STORED_FILE_SIZE)} 이하 파일만 내용이 저장됩니다. 이 파일은
              이름·크기 등 정보만 등록되며 다운로드할 수 없습니다.
            </span>
          </Notice>
        )}

        <Field label="폴더" required error={errors.folder?.message}>
          {(id) => (
            <Select id={id} aria-invalid={!!errors.folder} {...register("folder")}>
              {data.archiveFolders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="설명">
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
      </Stack>
    </Modal>
  );
}
