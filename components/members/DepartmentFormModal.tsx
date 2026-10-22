"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Modal, Select, Stack } from "@/components/ui";
import { createId } from "@/lib/id";
import { type DepartmentFormValues, departmentSchema } from "@/lib/schemas/member";
import { useData } from "@/lib/store";
import { flattenDepartments } from "./OrgTree";

interface Props {
  defaultParentId: string | null;
  onClose: () => void;
}

export function DepartmentFormModal({ defaultParentId, onClose }: Props) {
  const { data, update } = useData();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: "", parentId: defaultParentId ?? "" },
  });

  const submit = handleSubmit(({ name, parentId }) => {
    if (data.departments.some((d) => d.name === name && (d.parentId ?? "") === parentId))
      return setError("name", { message: "같은 위치에 동일한 이름의 부서가 있습니다." });

    update((prev) => ({
      ...prev,
      departments: [...prev.departments, { id: createId("d"), name, parentId: parentId || null }],
    }));
    onClose();
  });

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
      <form id="department-form" onSubmit={submit} noValidate>
        <Stack>
          <Field label="부서명" required error={errors.name?.message}>
            {(id) => (
              <Input
                id={id}
                autoFocus
                aria-invalid={!!errors.name}
                {...register("name")}
              />
            )}
          </Field>
          <Field label="상위 부서" hint="선택하지 않으면 최상위 부서로 추가됩니다.">
            {(id) => (
              <Select id={id} {...register("parentId")}>
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
