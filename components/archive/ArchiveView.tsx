"use client";

import styled from "@emotion/styled";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Download,
  File,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Presentation,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { getErrorMessage } from "@/apis/defaultInstance";
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  Input,
  LoadingState,
  Modal,
  MutedCell,
  PageHeader,
  Row,
  SearchInput,
  Table,
  TableWrap,
  Toolbar,
  transientOptions,
} from "@/components/ui";
import { formatDate } from "@/lib/date";
import { setServerErrors } from "@/lib/form";
import { createFolderSchema, FOLDER_NAME_MAX, type FolderFormValues } from "@/lib/schemas/archive";
import {
  useArchiveFiles,
  useArchiveFolders,
  useCreateArchiveFolder,
  useDeleteArchiveFile,
  useDownloadArchiveFile,
} from "@/queries/archive";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import type { ArchiveFile, ArchiveFileListParams } from "@/types";
import { mq } from "@/styles/theme";
import { formatFileSize, getExtension } from "./format";
import { UploadModal } from "./UploadModal";

const ALL = "__all__";

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;

  ${mq.md} {
    grid-template-columns: 220px minmax(0, 1fr);
    align-items: start;
  }
`;

const FolderTitle = styled.p`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 8px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const FolderButton = styled("button", transientOptions)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  text-align: left;
  font-weight: ${({ $active }) => ($active ? 600 : 500)};
  background: ${({ theme, $active }) => ($active ? theme.colors.primarySoft : "transparent")};
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textMuted)};

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? theme.colors.primarySoft : theme.colors.surfaceHover};
  }

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

const Search = styled(SearchInput)`
  width: 100%;

  ${mq.sm} {
    width: 240px;
  }
`;

const FileName = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 320px;

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: ${({ theme }) => theme.colors.primary};
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }
`;

const DescriptionCell = styled(MutedCell)`
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionError = styled.p`
  margin-bottom: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

/** 내용이 저장된 파일(hasContent)만 내려받을 수 있다. 없으면 비활성 표시 */
const DownloadButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.textMuted};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &:disabled,
  &[aria-disabled="true"] {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &:disabled:hover,
  &[aria-disabled="true"]:hover {
    background: transparent;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

function FileIcon({ name }: { name: string }) {
  const ext = getExtension(name);
  if (["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext)) return <FileImage />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet />;
  if (["ppt", "pptx", "key"].includes(ext)) return <Presentation />;
  if (["zip", "7z", "rar", "tar", "gz"].includes(ext)) return <FileArchive />;
  if (["pdf", "doc", "docx", "txt", "md", "hwp"].includes(ext)) return <FileText />;
  return <File />;
}

export function ArchiveView() {
  const { getMemberName } = useDirectory();
  const user = useCurrentUser();
  /** 선택한 폴더 id (전체는 ALL) */
  const [folder, setFolder] = useState(ALL);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArchiveFile | null>(null);

  const foldersQuery = useArchiveFolders();
  const folders = useMemo(() => foldersQuery.data ?? [], [foldersQuery.data]);

  // 폴더·검색 필터와 정렬(최신 업로드순)은 서버가 처리한다. 값이 없는 조건은 빼서 전체 조회와 캐시를 공유한다.
  const keyword = query.trim();
  const params: ArchiveFileListParams = {
    ...(folder !== ALL && { folderId: folder }),
    ...(keyword && { q: keyword }),
  };
  const filesQuery = useArchiveFiles(params);
  // 머리글의 전체 개수·용량용
  const { data: allFiles } = useArchiveFiles();

  const createFolder = useCreateArchiveFolder();
  const deleteFile = useDeleteArchiveFile();
  const downloadFile = useDownloadArchiveFile();
  const actionError = deleteFile.error ?? downloadFile.error;

  const folderSchema = useMemo(() => createFolderSchema(folders.map((f) => f.name)), [folders]);
  const {
    register: registerFolder,
    handleSubmit: handleFolderSubmit,
    reset: resetFolderForm,
    setError: setFolderError,
    formState: { errors: folderErrors },
  } = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: { name: "" },
  });

  const totalCount = folders.reduce((sum, f) => sum + f.fileCount, 0);
  const totalSize = (allFiles ?? []).reduce((sum, f) => sum + f.size, 0);
  const selectedFolderName = folders.find((f) => f.id === folder)?.name ?? "";
  // 폴더 목록이 늦게 와도 기본 폴더가 잡히도록 업로드 모달은 이 값으로 다시 만든다.
  const uploadFolderId = folder === ALL ? (folders[0]?.id ?? "") : folder;

  const closeFolderModal = () => {
    setFolderModalOpen(false);
    resetFolderForm();
  };

  const handleAddFolder = handleFolderSubmit((values) =>
    createFolder.mutate(values, {
      onSuccess: (created) => {
        setFolder(created.id);
        closeFolderModal();
      },
      onError: (error) => {
        if (!setServerErrors(error, setFolderError)) setFolderError("name", { message: getErrorMessage(error) });
      },
    }),
  );

  const folderItems = [
    { value: ALL, label: "전체 파일", count: totalCount },
    ...folders.map((f) => ({ value: f.id, label: f.name, count: f.fileCount })),
  ];

  const renderFolders = () => {
    if (foldersQuery.isPending) return <LoadingState />;
    if (foldersQuery.error) {
      return <ErrorState message={getErrorMessage(foldersQuery.error)} onRetry={() => foldersQuery.refetch()} />;
    }
    return (
      <ul>
        {folderItems.map((item) => (
          <li key={item.value}>
            <FolderButton
              type="button"
              $active={folder === item.value}
              aria-pressed={folder === item.value}
              onClick={() => setFolder(item.value)}
            >
              {folder === item.value ? <FolderOpen /> : <Folder />}
              <span>{item.label}</span>
              <small>{item.count}</small>
            </FolderButton>
          </li>
        ))}
      </ul>
    );
  };

  const renderFiles = () => {
    if (filesQuery.isPending) return <LoadingState />;
    if (filesQuery.error) {
      return <ErrorState message={getErrorMessage(filesQuery.error)} onRetry={() => filesQuery.refetch()} />;
    }
    const files = filesQuery.data;
    if (files.length === 0) {
      return (
        <EmptyState
          title="파일이 없습니다"
          description={user.isManager ? "새 파일을 업로드해 보세요." : "매니저가 올린 자료가 여기에 표시됩니다."}
        />
      );
    }
    return (
      <Table>
        <thead>
          <tr>
            <th>이름</th>
            {folder === ALL && <th>폴더</th>}
            <th style={{ width: 90 }}>크기</th>
            <th style={{ width: 100 }}>업로더</th>
            <th style={{ width: 110 }}>업로드일</th>
            <th>설명</th>
            <th style={{ width: 90 }} aria-label="작업" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const canDelete = file.uploaderId === user.id || user.isManager;
            return (
              <tr key={file.id}>
                <td>
                  <FileName title={file.name}>
                    <FileIcon name={file.name} />
                    <span>{file.name}</span>
                  </FileName>
                </td>
                {folder === ALL && <MutedCell>{file.folder}</MutedCell>}
                <MutedCell>{formatFileSize(file.size)}</MutedCell>
                <td>{getMemberName(file.uploaderId)}</td>
                <MutedCell>{formatDate(file.uploadedAt)}</MutedCell>
                <DescriptionCell title={file.description}>{file.description || "-"}</DescriptionCell>
                <td>
                  <Row $gap={2} $wrap={false}>
                    {file.hasContent ? (
                      <DownloadButton
                        type="button"
                        aria-label={`${file.name} 다운로드`}
                        disabled={downloadFile.isPending && downloadFile.variables?.id === file.id}
                        onClick={() => downloadFile.mutate(file)}
                      >
                        <Download />
                      </DownloadButton>
                    ) : (
                      <DownloadButton
                        type="button"
                        aria-disabled="true"
                        aria-label="다운로드 불가"
                        title="파일 내용이 저장되지 않아 내려받을 수 없습니다"
                      >
                        <Download />
                      </DownloadButton>
                    )}
                    {canDelete && (
                      <IconButton
                        $size={32}
                        aria-label={`${file.name} 삭제`}
                        onClick={() => setDeleteTarget(file)}
                      >
                        <Trash2 />
                      </IconButton>
                    )}
                  </Row>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  return (
    <>
      <PageHeader
        title="자료실"
        description={`사내 문서와 자료를 폴더별로 공유합니다. · 전체 ${totalCount}개, ${formatFileSize(totalSize)}`}
        actions={
          // 업로드는 매니저만 할 수 있다(서버도 막는다).
          user.isManager && (
            <Button onClick={() => setUploadOpen(true)} disabled={folders.length === 0}>
              <Upload />
              파일 업로드
            </Button>
          )
        }
      />

      <Layout>
        <Card $padding={12}>
          <FolderTitle>
            폴더
            {user.isManager && (
              <IconButton $size={28} aria-label="폴더 추가" onClick={() => setFolderModalOpen(true)}>
                <FolderPlus />
              </IconButton>
            )}
          </FolderTitle>
          {renderFolders()}
        </Card>

        <div style={{ minWidth: 0 }}>
          <Toolbar>
            <strong>{folder === ALL ? "전체 파일" : selectedFolderName}</strong>
            <Search
              type="search"
              placeholder="파일명, 설명 검색"
              aria-label="파일 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Toolbar>

          {actionError && <ActionError role="alert">{getErrorMessage(actionError)}</ActionError>}
          <TableWrap>{renderFiles()}</TableWrap>
        </div>
      </Layout>

      <UploadModal
        key={uploadFolderId}
        open={user.isManager && uploadOpen}
        folders={folders}
        defaultFolderId={uploadFolderId}
        onClose={() => setUploadOpen(false)}
      />

      <Modal
        open={folderModalOpen}
        title="폴더 추가"
        width={400}
        onClose={closeFolderModal}
        footer={
          <>
            <Button $variant="secondary" onClick={closeFolderModal}>
              취소
            </Button>
            <Button onClick={handleAddFolder} disabled={createFolder.isPending}>
              추가
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddFolder} noValidate>
          <Field label="폴더 이름" required error={folderErrors.name?.message}>
            {(id) => (
              <Input
                id={id}
                maxLength={FOLDER_NAME_MAX}
                placeholder="예: 회계"
                aria-invalid={!!folderErrors.name}
                {...registerFolder("name")}
              />
            )}
          </Field>
        </form>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title="파일 삭제"
        message={`'${deleteTarget?.name ?? ""}' 파일을 삭제할까요?`}
        confirmLabel="삭제"
        danger
        onConfirm={() => deleteTarget && deleteFile.mutate(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
