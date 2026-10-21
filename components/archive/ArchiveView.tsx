"use client";

import styled from "@emotion/styled";
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
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  Field,
  IconButton,
  Input,
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
import { getMemberName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { ArchiveFile } from "@/lib/types";
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

/** dataURL이 있으면 a[download], 없으면 비활성 버튼 */
const DownloadLink = styled.a`
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

  &[aria-disabled="true"] {
    opacity: 0.35;
    cursor: not-allowed;
  }

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
  const { data, update } = useData();
  const user = useCurrentUser();
  const [folder, setFolder] = useState(ALL);
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolder, setNewFolder] = useState("");
  const [folderError, setFolderError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ArchiveFile | null>(null);

  const files = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return data.archiveFiles
      .filter(
        (f) =>
          (folder === ALL || f.folder === folder) &&
          (!keyword ||
            f.name.toLowerCase().includes(keyword) ||
            f.description.toLowerCase().includes(keyword)),
      )
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [data.archiveFiles, folder, query]);

  const totalSize = data.archiveFiles.reduce((sum, f) => sum + f.size, 0);

  const closeFolderModal = () => {
    setFolderModalOpen(false);
    setNewFolder("");
    setFolderError("");
  };

  const handleAddFolder = () => {
    const name = newFolder.trim();
    if (!name) return setFolderError("폴더 이름을 입력하세요.");
    if (data.archiveFolders.includes(name)) return setFolderError("이미 있는 폴더 이름입니다.");
    update((prev) => ({ ...prev, archiveFolders: [...prev.archiveFolders, name] }));
    setFolder(name);
    closeFolderModal();
  };

  const handleDelete = (file: ArchiveFile) =>
    update((prev) => ({ ...prev, archiveFiles: prev.archiveFiles.filter((f) => f.id !== file.id) }));

  const folderItems = [
    { value: ALL, label: "전체 파일", count: data.archiveFiles.length },
    ...data.archiveFolders.map((f) => ({
      value: f,
      label: f,
      count: data.archiveFiles.filter((file) => file.folder === f).length,
    })),
  ];

  return (
    <>
      <PageHeader
        title="자료실"
        description={`사내 문서와 자료를 폴더별로 공유합니다. · 전체 ${data.archiveFiles.length}개, ${formatFileSize(totalSize)}`}
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload />
            파일 업로드
          </Button>
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
        </Card>

        <div style={{ minWidth: 0 }}>
          <Toolbar>
            <strong>{folder === ALL ? "전체 파일" : folder}</strong>
            <Search
              type="search"
              placeholder="파일명, 설명 검색"
              aria-label="파일 검색"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </Toolbar>

          <TableWrap>
            {files.length === 0 ? (
              <EmptyState title="파일이 없습니다" description="새 파일을 업로드해 보세요." />
            ) : (
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
                        <td>{getMemberName(data, file.uploaderId)}</td>
                        <MutedCell>{formatDate(file.uploadedAt)}</MutedCell>
                        <DescriptionCell title={file.description}>
                          {file.description || "-"}
                        </DescriptionCell>
                        <td>
                          <Row $gap={2} $wrap={false}>
                            {file.dataUrl ? (
                              <DownloadLink
                                href={file.dataUrl}
                                download={file.name}
                                aria-label={`${file.name} 다운로드`}
                              >
                                <Download />
                              </DownloadLink>
                            ) : (
                              <DownloadLink
                                role="link"
                                aria-disabled="true"
                                aria-label="다운로드 불가"
                                title="데모 데이터는 파일 내용이 없습니다"
                              >
                                <Download />
                              </DownloadLink>
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
            )}
          </TableWrap>
        </div>
      </Layout>

      <UploadModal
        key={folder}
        open={uploadOpen}
        defaultFolder={folder === ALL ? data.archiveFolders[0] : folder}
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
            <Button onClick={handleAddFolder}>추가</Button>
          </>
        }
      >
        <Field label="폴더 이름" required error={folderError}>
          {(id) => (
            <Input
              id={id}
              value={newFolder}
              maxLength={30}
              placeholder="예: 회계"
              aria-invalid={!!folderError}
              onChange={(e) => {
                setNewFolder(e.target.value);
                setFolderError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
            />
          )}
        </Field>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        title="파일 삭제"
        message={`'${deleteTarget?.name ?? ""}' 파일을 삭제할까요?`}
        confirmLabel="삭제"
        danger
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
