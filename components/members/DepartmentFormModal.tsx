"use client";

import { useState } from "react";
import { Button, Field, Input, Modal, Select, Stack } from "@/components/ui";
import { createId } from "@/lib/id";
import { useData } from "@/lib/store";
import { flattenDepartments } from "./OrgTree";

interface Props {
  defaultParentId: string | null;
  onClose: () => void;
}

export function DepartmentFormModal({ defaultParentId, onClose }: Props) {
  const { data, update } = useData();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState(defaultParentId ?? "");
  const [error, setError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("부서명을 입력하세요.");
    if (data.departments.some((d) => d.name === trimmed && (d.parentId ?? "") === parentId))
      return setError("같은 위치에 동일한 이름의 부서가 있습니다.");

    update((prev) => ({
      ...prev,
      departments: [...prev.departments, { id: createId("d"), name: trimmed, parentId: parentId || null }],
    }));
    onClose();
  };

  return (
    <Modal
      open
      title="부서 추가"
      onClose={onClose}
      width={420}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="department-form">
            추가
          </Button>
        </>
      }
    >
      <form id="department-form" onSubmit={handleSubmit} noValidate>
        <Stack>
          <Field label="부서명" required error={error}>
            {(id) => (
              <Input
                id={id}
                value={name}
                autoFocus
                onChange={(e) => {
                  setName(e.target.value);
                  setError(undefined);
                }}
                aria-invalid={!!error}
              />
            )}
          </Field>
          <Field label="상위 부서" hint="선택하지 않으면 최상위 부서로 추가됩니다.">
            {(id) => (
              <Select id={id} value={parentId} onChange={(e) => setParentId(e.target.value)}>
                <option value="">(최상위)</option>
                {flattenDepartments(data).map(({ department, depth }) => (
                  <option key={department.id} value={department.id}>
                    {"　".repeat(depth)}
                    {department.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </Stack>
      </form>
    </Modal>
  );
}
