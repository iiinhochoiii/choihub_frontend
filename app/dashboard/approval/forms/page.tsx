"use client";

import styled from "@emotion/styled";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormEditorModal } from "@/components/approval/FormEditorModal";
import {
  AccessDenied,
  Badge,
  Button,
  ButtonLink,
  CheckboxLabel,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  Modal,
  MutedCell,
  PageHeader,
  Row,
  Stack,
  Table,
  TableWrap,
  TitleCell,
} from "@/components/ui";
import { ApiError, getErrorMessage } from "@/apis/defaultInstance";
import { formatDate } from "@/lib/date";
import { useApprovalForms, useDeleteApprovalForm, useSetApprovalFormActive } from "@/queries/approval";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import type { ApprovalForm } from "@/types";

const ErrorText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.danger};
`;

export default function ApprovalFormsPage() {
  const user = useCurrentUser();
  if (!user.isManager) return <AccessDenied />;
  return <FormsManager />;
}

function FormsManager() {
  const { getMemberName } = useDirectory();
  // 매니저는 중지된 양식까지 전체를 받는다.
  const { data: forms, isPending, error, refetch } = useApprovalForms();
  const setActiveMutation = useSetApprovalFormActive();
  const deleteMutation = useDeleteApprovalForm();
  const [editor, setEditor] = useState<{ open: boolean; form: ApprovalForm | null }>({
    open: false,
    form: null,
  });
  const [deleting, setDeleting] = useState<ApprovalForm | null>(null);
  /** 기안된 문서가 있어 삭제가 막힌 양식과 서버 안내 문구 */
  const [inUse, setInUse] = useState<{ form: ApprovalForm; message: string } | null>(null);

  const setActive = (id: string, active: boolean, onSuccess?: () => void) =>
    setActiveMutation.mutate({ id, active }, { onSuccess, onError: (err) => window.alert(getErrorMessage(err)) });

  const closeDelete = () => {
    setDeleting(null);
    deleteMutation.reset();
  };

  const confirmDelete = (form: ApprovalForm) =>
    deleteMutation.mutate(form.id, {
      onSuccess: closeDelete,
      onError: (err) => {
        // 기안된 문서가 있으면 서버가 409로 막는다. 사용 중지를 안내하는 창으로 바꿔 보여 준다.
        if (err instanceof ApiError && err.status === 409) {
          closeDelete();
          setInUse({ form, message: err.message });
        }
      },
    });

  return (
    <>
      <PageHeader
        title="결재 양식 관리"
        description="결재 양식과 결재선을 등록합니다. 직원은 등록된 양식으로만 기안할 수 있습니다."
        actions={
          <>
            <ButtonLink href="/dashboard/approval" $variant="secondary">
              <ArrowLeft />
              전자결재
            </ButtonLink>
            <Button onClick={() => setEditor({ open: true, form: null })}>
              <Plus />새 양식
            </Button>
          </>
        }
      />

      <TableWrap>
        {isPending ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
        ) : forms.length === 0 ? (
          <EmptyState title="등록된 양식이 없습니다." />
        ) : (
          <Table>
            <thead>
              <tr>
                <th>양식 이름</th>
                <th>카테고리</th>
                <th>입력 항목</th>
                <th>결재선</th>
                <th>수정일</th>
                <th>사용</th>
                <th aria-label="관리" />
              </tr>
            </thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id}>
                  <TitleCell $maxWidth={240}>{form.name}</TitleCell>
                  <td>
                    <Badge $tone="primary">{form.category}</Badge>
                  </td>
                  <MutedCell>{form.fields.length}개</MutedCell>
                  <td>
                    {form.approverIds.length === 0
                      ? "-"
                      : form.approverIds.map((id) => getMemberName(id)).join(" → ")}
                  </td>
                  <MutedCell>{formatDate(form.updatedAt)}</MutedCell>
                  <td>
                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={form.active}
                        disabled={setActiveMutation.isPending}
                        onChange={(e) => setActive(form.id, e.target.checked)}
                      />
                      {form.active ? "사용" : "중지"}
                    </CheckboxLabel>
                  </td>
                  <td>
                    <Row $gap={2} $wrap={false} $justify="flex-end">
                      <IconButton aria-label="수정" onClick={() => setEditor({ open: true, form })}>
                        <Pencil />
                      </IconButton>
                      <IconButton aria-label="삭제" onClick={() => setDeleting(form)}>
                        <Trash2 />
                      </IconButton>
                    </Row>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </TableWrap>

      <FormEditorModal
        open={editor.open}
        form={editor.form}
        onClose={() => setEditor({ open: false, form: null })}
      />

      <Modal
        open={!!deleting}
        title="양식 삭제"
        width={400}
        onClose={closeDelete}
        footer={
          <>
            <Button $variant="secondary" onClick={closeDelete}>
              취소
            </Button>
            <Button
              $variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleting && confirmDelete(deleting)}
            >
              삭제
            </Button>
          </>
        }
      >
        <Stack $gap={12}>
          <p>&apos;{deleting?.name}&apos; 양식을 삭제합니다. 되돌릴 수 없습니다.</p>
          {deleteMutation.error && <ErrorText role="alert">{getErrorMessage(deleteMutation.error)}</ErrorText>}
        </Stack>
      </Modal>

      <Modal
        open={!!inUse}
        title="삭제할 수 없는 양식"
        width={420}
        onClose={() => setInUse(null)}
        footer={
          <>
            <Button $variant="secondary" onClick={() => setInUse(null)}>
              닫기
            </Button>
            {inUse?.form.active && (
              <Button
                disabled={setActiveMutation.isPending}
                onClick={() => setActive(inUse.form.id, false, () => setInUse(null))}
              >
                사용 중지
              </Button>
            )}
          </>
        }
      >
        <p>{inUse?.message}</p>
      </Modal>
    </>
  );
}
