"use client";

import styled from "@emotion/styled";
import { Building2, ChevronRight, Users } from "lucide-react";
import { Select, transientOptions } from "@/components/ui";
import { getDepartmentTreeIds } from "@/lib/selectors";
import type { Department, GroupwareData } from "@/lib/types";
import { mq } from "@/styles/theme";

const TreeWrap = styled.nav`
  display: none;

  ${mq.md} {
    display: block;
  }
`;

const MobileSelect = styled.div`
  ${mq.md} {
    display: none;
  }
`;

const NodeButton = styled("button", transientOptions)<{ $depth: number }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px 0 ${({ $depth }) => 10 + $depth * 16}px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  text-align: left;
  color: ${({ theme }) => theme.colors.textMuted};

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

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &[aria-current="true"] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;

    small {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

interface OrgTreeProps {
  data: GroupwareData;
  selected: string; // "all" 또는 부서 id
  onSelect: (id: string) => void;
}

export function countMembers(data: GroupwareData, departmentId: string): number {
  const ids = new Set(getDepartmentTreeIds(data, departmentId));
  return data.members.filter((m) => ids.has(m.departmentId)).length;
}

/** 부서를 트리 순서(부모 → 자식)로 평탄화 */
export function flattenDepartments(
  data: GroupwareData,
  parentId: string | null = null,
  depth = 0,
): { department: Department; depth: number }[] {
  return data.departments
    .filter((d) => d.parentId === parentId)
    .flatMap((department) => [
      { department, depth },
      ...flattenDepartments(data, department.id, depth + 1),
    ]);
}

export function OrgTree({ data, selected, onSelect }: OrgTreeProps) {
  const flat = flattenDepartments(data);

  return (
    <>
      <TreeWrap aria-label="조직도">
        <NodeButton
          type="button"
          $depth={0}
          aria-current={selected === "all"}
          onClick={() => onSelect("all")}
        >
          <Users />
          <span>전체</span>
          <small>{data.members.length}</small>
        </NodeButton>
        {flat.map(({ department, depth }) => (
          <NodeButton
            key={department.id}
            type="button"
            $depth={depth + 1}
            aria-current={selected === department.id}
            onClick={() => onSelect(department.id)}
          >
            {depth === 0 ? <Building2 /> : <ChevronRight />}
            <span>{department.name}</span>
            <small>{countMembers(data, department.id)}</small>
          </NodeButton>
        ))}
      </TreeWrap>

      <MobileSelect>
        <Select value={selected} onChange={(e) => onSelect(e.target.value)} aria-label="부서 선택">
          <option value="all">전체 ({data.members.length})</option>
          {flat.map(({ department, depth }) => (
            <option key={department.id} value={department.id}>
              {"　".repeat(depth)}
              {department.name} ({countMembers(data, department.id)})
            </option>
          ))}
        </Select>
      </MobileSelect>
    </>
  );
}
