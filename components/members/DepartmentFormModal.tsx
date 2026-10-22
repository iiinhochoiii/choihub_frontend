"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Field, Input, Modal, Notice, Select, Stack } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { setServerErrors } from "@/lib/form";
import { type DepartmentFormValues, departmentSchema } from "@/lib/schemas/member";
import { useCreateDepartment, useDepartments } from "@/queries/directory";
import { flattenDepartments } from "./OrgTree";

interface Props {
  defaultParentId: string | null;
  onClose: () => void;
}

export function DepartmentFormModal({ defaultParentId, onClose }: Props) {
  const departments = useDepartments();
  const createDepartment = useCreateDepartment();
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setSubmitError(null);
    // 같은 위치의 이름 중복은 서버가 검사한다.
    createDepartment.mutate(
      { name, parentId: parentId || null },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (!setServerErrors(error, setError)) setSubmitError(getErrorMessage(error));
        },
      },
    );
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
          <Button type="submit" form="department-form" disabled={createDepartment.isPending}>
            추가
          </Button>
        </>
      }
    >
      {submitError && (
        <Notice $tone="warning">
          <AlertCircle />
          {submitError}
        </Notice>
      )}
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
                {flattenDepartments(departments).map(({ department, depth }) => (
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
