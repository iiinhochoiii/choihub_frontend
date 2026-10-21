"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { CredentialCard } from "@/components/common/CredentialCard";
import { Button, Field, FormGrid, Input, Modal, Notice, Select } from "@/components/ui";
import { todayKey } from "@/lib/date";
import { createId } from "@/lib/id";
import { MEMBER_STATUS, ROLE_LABELS } from "@/lib/labels";
import { generatePassword, isEmailTaken, pickAvatarColor } from "@/lib/platform";
import { useData, usePlatform } from "@/lib/store";
import type { Member, MemberStatus, Role } from "@/lib/types";
import { flattenDepartments } from "./OrgTree";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Props {
  /** null이면 신규 추가 */
  member: Member | null;
  currentUserId: string;
  defaultDepartmentId?: string;
  onClose: () => void;
  onSaved: (member: Member) => void;
}

type FormState = Pick<
  Member,
  "name" | "email" | "departmentId" | "position" | "role" | "phone" | "extension" | "joinedAt" | "birthday" | "status"
> & { annualLeaveTotal: string };

type Errors = Partial<Record<keyof FormState, string>>;

export function MemberFormModal({ member, currentUserId, defaultDepartmentId, onClose, onSaved }: Props) {
  const { data, update } = useData();
  const { platform } = usePlatform();
  const [issued, setIssued] = useState<Member | null>(null);
  const isNew = member === null;
  const isSelf = member?.id === currentUserId;
  const departments = flattenDepartments(data);

  const [form, setForm] = useState<FormState>(() => ({
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
    annualLeaveTotal: String(member?.annualLeaveTotal ?? data.company.defaultAnnualLeave),
  }));
  const [errors, setErrors] = useState<Errors>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "이름을 입력하세요.";
    const email = form.email.trim().toLowerCase();
    if (!email) next.email = "이메일을 입력하세요.";
    else if (!EMAIL_PATTERN.test(email)) next.email = "이메일 형식이 올바르지 않습니다.";
    else if (isEmailTaken(platform, email, member?.id))
      next.email = "이미 ChoiHub에서 사용 중인 이메일입니다. (로그인 ID는 전체 회사에서 유일해야 합니다)";
    if (!form.departmentId) next.departmentId = "부서를 선택하세요.";
    if (!form.position.trim()) next.position = "직급을 입력하세요.";
    if (!form.phone.trim()) next.phone = "휴대폰 번호를 입력하세요.";
    if (form.birthday && !/^\d{2}-\d{2}$/.test(form.birthday)) next.birthday = "MM-DD 형식으로 입력하세요.";
    const leave = Number(form.annualLeaveTotal);
    if (!Number.isFinite(leave) || leave < 0 || leave > 40) next.annualLeaveTotal = "0~40 사이 숫자를 입력하세요.";

    if (member?.role === "manager" && form.role === "employee") {
      if (isSelf) next.role = "본인의 매니저 권한은 해제할 수 없습니다.";
      else if (data.members.filter((m) => m.role === "manager").length <= 1)
        next.role = "마지막 매니저의 권한은 해제할 수 없습니다.";
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const values = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      position: form.position.trim(),
      phone: form.phone.trim(),
      extension: form.extension.trim(),
      annualLeaveTotal: Number(form.annualLeaveTotal),
    };

    const saved: Member = member
      ? { ...member, ...values }
      : {
          ...values,
          id: createId("m"),
          password: generatePassword(),
          mustChangePassword: true,
          color: pickAvatarColor(data.members.length),
        };

    update((prev) => ({
      ...prev,
      members: member
        ? prev.members.map((m) => (m.id === member.id ? saved : m))
        : [...prev.members, saved],
    }));
    // 신규 계정은 초기 비밀번호를 한 번 보여준 뒤 닫는다.
    if (member) onSaved(saved);
    else setIssued(saved);
  };

  if (issued) {
    return (
      <Modal
        open
        title="구성원 계정 발급 완료"
        onClose={() => onSaved(issued)}
        footer={<Button onClick={() => onSaved(issued)}>확인</Button>}
      >
        <p style={{ marginBottom: 16 }}>
          <strong>{issued.name}</strong>님의 계정을 만들었습니다. 아래 로그인 정보를 본인에게 전달하세요.
        </p>
        <CredentialCard email={issued.email} password={issued.password} />
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
          <Button type="submit" form="member-form">
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
      <form id="member-form" onSubmit={handleSubmit} noValidate>
        <FormGrid>
          <Field label="이름" required error={errors.name}>
            {(id) => <Input id={id} value={form.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} />}
          </Field>
          <Field label="이메일" required error={errors.email}>
            {(id) => (
              <Input
                id={id}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
            )}
          </Field>
          <Field label="부서" required error={errors.departmentId}>
            {(id) => (
              <Select id={id} value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                {departments.map(({ department, depth }) => (
                  <option key={department.id} value={department.id}>
                    {"　".repeat(depth)}
                    {department.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="직급" required error={errors.position}>
            {(id) => (
              <Input
                id={id}
                value={form.position}
                placeholder="예: 선임, 팀장"
                onChange={(e) => set("position", e.target.value)}
                aria-invalid={!!errors.position}
              />
            )}
          </Field>
          <Field
            label="권한"
            required
            error={errors.role}
            hint={isSelf ? "본인의 권한은 변경할 수 없습니다." : undefined}
          >
            {(id) => (
              <Select
                id={id}
                value={form.role}
                disabled={isSelf}
                onChange={(e) => set("role", e.target.value as Role)}
              >
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
              <Select id={id} value={form.status} onChange={(e) => set("status", e.target.value as MemberStatus)}>
                {(Object.keys(MEMBER_STATUS) as MemberStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {MEMBER_STATUS[status].label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="휴대폰" required error={errors.phone}>
            {(id) => (
              <Input
                id={id}
                type="tel"
                value={form.phone}
                placeholder="010-0000-0000"
                onChange={(e) => set("phone", e.target.value)}
                aria-invalid={!!errors.phone}
              />
            )}
          </Field>
          <Field label="내선번호">
            {(id) => <Input id={id} value={form.extension} onChange={(e) => set("extension", e.target.value)} />}
          </Field>
          <Field label="입사일" required>
            {(id) => <Input id={id} type="date" value={form.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} />}
          </Field>
          <Field label="생일" hint="MM-DD (예: 07-09)" error={errors.birthday}>
            {(id) => (
              <Input
                id={id}
                value={form.birthday}
                placeholder="MM-DD"
                onChange={(e) => set("birthday", e.target.value)}
                aria-invalid={!!errors.birthday}
              />
            )}
          </Field>
          <Field label="연차 일수" required error={errors.annualLeaveTotal} hint={`회사 기본값 ${data.company.defaultAnnualLeave}일`}>
            {(id) => (
              <Input
                id={id}
                type="number"
                min={0}
                max={40}
                step={0.5}
                value={form.annualLeaveTotal}
                onChange={(e) => set("annualLeaveTotal", e.target.value)}
                aria-invalid={!!errors.annualLeaveTotal}
              />
            )}
          </Field>
        </FormGrid>
      </form>
    </Modal>
  );
}
