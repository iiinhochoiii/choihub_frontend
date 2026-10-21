"use client";

import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormEditorModal } from "@/components/approval/FormEditorModal";
import {
  AccessDenied,
  Badge,
  Button,
  ButtonLink,
  CheckboxLabel,
  ConfirmModal,
  EmptyState,
  IconButton,
  Modal,
  MutedCell,
  PageHeader,
  Row,
  Table,
  TableWrap,
  TitleCell,
} from "@/components/ui";
import { formatDate } from "@/lib/date";
import { getMemberName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { ApprovalForm } from "@/lib/types";

export default function ApprovalFormsPage() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [editor, setEditor] = useState<{ open: boolean; form: ApprovalForm | null }>({
    open: false,
    form: null,
  });
  const [deleting, setDeleting] = useState<ApprovalForm | null>(null);
  const [inUse, setInUse] = useState<ApprovalForm | null>(null);

  if (!user.isManager) return <AccessDenied />;

  const setActive = (id: string, active: boolean) =>
    update((prev) => ({
      ...prev,
      approvalForms: prev.approvalForms.map((f) => (f.id === id ? { ...f, active } : f)),
    }));

  const requestDelete = (form: ApprovalForm) => {
    if (data.approvalDocs.some((d) => d.formId === form.id)) setInUse(form);
    else setDeleting(form);
  };

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
        {data.approvalForms.length === 0 ? (
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
              {data.approvalForms.map((form) => (
                <tr key={form.id}>
                  <TitleCell $maxWidth={240}>{form.name}</TitleCell>
                  <td>
                    <Badge $tone="primary">{form.category}</Badge>
                  </td>
                  <MutedCell>{form.fields.length}개</MutedCell>
                  <td>
                    {form.approverIds.length === 0
                      ? "-"
                      : form.approverIds.map((id) => getMemberName(data, id)).join(" → ")}
                  </td>
                  <MutedCell>{formatDate(form.updatedAt)}</MutedCell>
                  <td>
                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={form.active}
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
                      <IconButton aria-label="삭제" onClick={() => requestDelete(form)}>
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

      <ConfirmModal
        open={!!deleting}
        title="양식 삭제"
        message={`'${deleting?.name}' 양식을 삭제합니다. 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          update((prev) => ({
            ...prev,
            approvalForms: prev.approvalForms.filter((f) => f.id !== deleting?.id),
          }))
        }
      />

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
            {inUse?.active && (
              <Button
                onClick={() => {
                  setActive(inUse.id, false);
                  setInUse(null);
                }}
              >
                사용 중지
              </Button>
            )}
          </>
        }
      >
        <p>
          &apos;{inUse?.name}&apos; 양식으로 기안된 문서가 있어 삭제할 수 없습니다.
          <br />
          대신 사용을 중지하면 새 문서 작성 목록에서 숨겨집니다.
        </p>
      </Modal>
    </>
  );
}
