"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CredentialCard } from "@/components/common/CredentialCard";
import { Button, Field, FormGrid, Input, Modal, Notice, Select } from "@/components/ui";
import { getErrorMessage } from "@/apis/defaultInstance";
import { todayKey } from "@/lib/date";
import { setServerErrors } from "@/lib/form";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import { type MemberFormInput, type MemberFormValues, memberSchema } from "@/lib/schemas/member";
import { useCompany, useCreateMember, useDepartments, useUpdateMember } from "@/queries/directory";
import type { Credential, Member, MemberStatus, Role } from "@/types";
import { flattenDepartments } from "./OrgTree";

interface Props {
  /** null이면 신규 추가 */
  member: Member | null;
  currentUserId: string;
  defaultDepartmentId?: string;
  onClose: () => void;
  onSaved: (member: Member) => void;
}

export function MemberFormModal({ member, currentUserId, defaultDepartmentId, onClose, onSaved }: Props) {
  const company = useCompany();
  const departments = flattenDepartments(useDepartments());
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const [issued, setIssued] = useState<{ member: Member; credential: Credential } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isNew = member === null;
  const isSelf = member?.id === currentUserId;
  const pending = createMember.isPending || updateMember.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<MemberFormInput, unknown, MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      name: member?.name ?? "",
      email: member?.email ?? "",
      departmentId: member?.departmentId ?? defaultDepartmentId ?? departments[0]?.department.id ?? "",
      position: member?.position ?? "",
      role: member?.role ?? "employee",
      phone: member?.phone ?? "",
      extension: member?.extension ?? "",
      joinedAt: member?.joinedAt ?? todayKey(),
      birthday: member?.birthday ?? "",
      status: member?.status ?? "active",
      annualLeaveTotal: member?.annualLeaveTotal ?? company.defaultAnnualLeave,
    },
  });

  const submit = handleSubmit((values) => {
    setSubmitError(null);
    // 로그인 ID 중복, 매니저 권한 해제 제한, 초기 비밀번호 발급은 서버가 처리한다.
    const onError = (error: unknown) => {
      if (!setServerErrors(error, setError)) setSubmitError(getErrorMessage(error));
    };
    if (member) {
      updateMember.mutate({ id: member.id, body: values }, { onSuccess: onSaved, onError });
    } else {
      // 신규 계정은 초기 비밀번호를 한 번 보여준 뒤 닫는다.
      createMember.mutate(values, { onSuccess: setIssued, onError });
    }
  });

  if (issued) {
    return (
      <Modal
        open
        title="구성원 계정 발급 완료"
        onClose={() => onSaved(issued.member)}
        footer={<Button onClick={() => onSaved(issued.member)}>확인</Button>}
      >
        <p style={{ marginBottom: 16 }}>
          <strong>{issued.member.name}</strong>님의 계정을 만들었습니다. 아래 로그인 정보를 본인에게 전달하세요.
        </p>
        <CredentialCard email={issued.credential.email} password={issued.credential.password} />
      </Modal>
    );
  }

  return (
    <Modal
      open
      title={isNew ? "구성원 추가" : "구성원 정보 수정"}
      onClose={onClose}
      width={600}
      footer={
        <>
          <Button $variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" form="member-form" disabled={pending}>
            {isNew ? "추가" : "저장"}
          </Button>
        </>
      }
    >
      {isNew && (
        <Notice>
          <Info />
          추가하면 초기 비밀번호가 자동으로 발급됩니다. 구성원은 첫 로그인 때 비밀번호를 변경해야 합니다.
        </Notice>
      )}
      {submitError && (
        <Notice $tone="warning">
          <AlertCircle />
          {submitError}
        </Notice>
      )}
      <form id="member-form" onSubmit={submit} noValidate>
        <FormGrid>
          <Field label="이름" required error={errors.name?.message}>
            {(id) => <Input id={id} aria-invalid={!!errors.name} {...register("name")} />}
          </Field>
          <Field label="이메일" required error={errors.email?.message}>
            {(id) => (
              <Input
                id={id}
                type="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
            )}
          </Field>
          <Field label="부서" required error={errors.departmentId?.message}>
            {(id) => (
              <Select id={id} {...register("departmentId")}>
                {departments.map(({ department, depth }) => (
                  <option key={department.id} value={department.id}>
                    {"　".repeat(depth)}
                    {department.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="직급" required error={errors.position?.message}>
            {(id) => (
              <Input
                id={id}
                placeholder="예: 선임, 팀장"
                aria-invalid={!!errors.position}
                {...register("position")}
              />
            )}
          </Field>
          <Field
            label="권한"
            required
            error={errors.role?.message}
            hint={isSelf ? "본인의 권한은 변경할 수 없습니다." : undefined}
          >
            {(id) => (
              <Select id={id} disabled={isSelf} {...register("role")}>
                {(Object.keys(ROLE_LABELS) as Role[]).map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="상태" required>
            {(id) => (
              <Select id={id} {...register("status")}>
                {(Object.keys(MEMBER_STATUS) as MemberStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {MEMBER_STATUS[status].label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="휴대폰" required error={errors.phone?.message}>
            {(id) => (
              <Input
                id={id}
                type="tel"
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
            )}
          </Field>
          <Field label="내선번호">
            {(id) => <Input id={id} {...register("extension")} />}
          </Field>
          <Field label="입사일" required>
            {(id) => <Input id={id} type="date" {...register("joinedAt")} />}
          </Field>
          <Field label="생일" hint="MM-DD (예: 07-09)" error={errors.birthday?.message}>
            {(id) => (
              <Input
                id={id}
                placeholder="MM-DD"
                aria-invalid={!!errors.birthday}
                {...register("birthday")}
              />
            )}
          </Field>
          <Field label="연차 일수" required error={errors.annualLeaveTotal?.message} hint={`회사 기본값 ${company.defaultAnnualLeave}일`}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={0}
                max={40}
                step={0.5}
                aria-invalid={!!errors.annualLeaveTotal}
                {...register("annualLeaveTotal")}
              />
            )}
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}
