"use client";

import styled from "@emotion/styled";
import { Info, Upload } from "lucide-react";
import { useState } from "react";
import { Button, Field, Modal, Notice, Select, Stack, Textarea } from "@/components/ui";
import { createId } from "@/lib/id";
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
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState(defaultFolder);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const tooLarge = !!file && file.size > MAX_STORED_FILE_SIZE;

  const handleClose = () => {
    setFile(null);
    setDescription("");
    setError("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("업로드할 파일을 선택하세요.");
      return;
    }
    setSaving(true);
    let dataUrl: string | undefined;
    if (!tooLarge) {
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
      description: description.trim(),
      dataUrl,
    };
    update((prev) => ({ ...prev, archiveFiles: [entry, ...prev.archiveFiles] }));
    setSaving(false);
    handleClose();
  };

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
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "업로드 중..." : "업로드"}
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
            <input
              type="file"
              aria-label="업로드할 파일"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError("");
              }}
            />
          </DropZone>
          {error && <ErrorText>{error}</ErrorText>}
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

        <Field label="폴더" required>
          {(id) => (
            <Select id={id} value={folder} onChange={(e) => setFolder(e.target.value)}>
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
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          )}
        </Field>
      </Stack>
    </Modal>
  );
}
