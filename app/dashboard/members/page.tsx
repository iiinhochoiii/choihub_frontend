"use client";

import styled from "@emotion/styled";
import { FolderPlus, LayoutGrid, List, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { DepartmentFormModal } from "@/components/members/DepartmentFormModal";
import { MemberDetailModal } from "@/components/members/MemberDetailModal";
import { MemberFormModal } from "@/components/members/MemberFormModal";
import { MemberList } from "@/components/members/MemberList";
import { OrgTree } from "@/components/members/OrgTree";
import {
  Button,
  Card,
  EmptyState,
  IconButton,
  Muted,
  PageHeader,
  Row,
  SearchInput,
  Toolbar,
} from "@/components/ui";
import { useCurrentUser } from "@/queries/auth";
import { useDirectory } from "@/queries/directory";
import type { Member } from "@/types";
import { mq } from "@/styles/theme";

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${mq.md} {
    grid-template-columns: 240px minmax(0, 1fr);
    align-items: start;
    gap: 20px;
  }
`;

const TreeCard = styled(Card)`
  ${mq.md} {
    position: sticky;
    top: calc(${({ theme }) => theme.layout.topbarHeight} + 16px);
  }
`;

const ViewToggle = styled.div`
  display: flex;
  padding: 2px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};

  button[aria-pressed="true"] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchBox = styled.div`
  flex: 1;
  min-width: 200px;
  max-width: 360px;
`;

type Modal =
  | { type: "detail"; memberId: string }
  | { type: "form"; memberId: string | null }
  | { type: "department" }
  | null;

export default function MembersPage() {
  const { members: allMembers, getDepartmentName, getDepartmentTreeIds, getMember } = useDirectory();
  const user = useCurrentUser();
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"card" | "table">("card");
  const [modal, setModal] = useState<Modal>(null);

  const members = useMemo(() => {
    const deptIds = selected === "all" ? null : new Set(getDepartmentTreeIds(selected));
    const q = query.trim().toLowerCase();
    return allMembers
      .filter((m) => !deptIds || deptIds.has(m.departmentId))
      .filter(
        (m) =>
          !q ||
          [m.name, m.email, m.phone, m.position, m.extension].some((v) => v.toLowerCase().includes(q)),
      )
      .sort((a, b) => a.departmentId.localeCompare(b.departmentId) || a.name.localeCompare(b.name, "ko"));
  }, [allMembers, getDepartmentTreeIds, selected, query]);

  const findMember = (id: string | null) => (id ? (getMember(id) ?? null) : null);

  return (
    <>
      <PageHeader
        title="구성원"
        description="조직도와 구성원 연락처를 확인합니다."
        actions={
          user.isManager && (
            <>
              <Button $variant="secondary" onClick={() => setModal({ type: "department" })}>
                <FolderPlus />
                부서 추가
              </Button>
              <Button onClick={() => setModal({ type: "form", memberId: null })}>
                <UserPlus />
                구성원 추가
              </Button>
            </>
          )
        }
      />

      <Layout>
        <TreeCard $padding={12}>
          <OrgTree selected={selected} onSelect={setSelected} />
        </TreeCard>

        <div>
          <Toolbar>
            <SearchBox>
              <SearchInput
                type="search"
                placeholder="이름, 이메일, 전화번호, 직급 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="구성원 검색"
              />
            </SearchBox>
            <Row $gap={12}>
              <Muted>
                {selected === "all" ? "전체" : getDepartmentName(selected)} · {members.length}명
              </Muted>
              <ViewToggle role="group" aria-label="보기 방식">
                <IconButton $size={30} aria-label="카드 보기" aria-pressed={view === "card"} onClick={() => setView("card")}>
                  <LayoutGrid />
                </IconButton>
                <IconButton $size={30} aria-label="목록 보기" aria-pressed={view === "table"} onClick={() => setView("table")}>
                  <List />
                </IconButton>
              </ViewToggle>
            </Row>
          </Toolbar>

          {members.length === 0 ? (
            <Card>
              <EmptyState icon={<Users />} title="구성원이 없습니다" description="검색어나 부서 선택을 바꿔 보세요." />
            </Card>
          ) : (
            <MemberList
              members={members}
              view={view}
              onSelect={(m: Member) => setModal({ type: "detail", memberId: m.id })}
            />
          )}
        </div>
      </Layout>

      {modal?.type === "detail" && (
        <MemberDetailModal
          member={findMember(modal.memberId)}
          canEdit={user.isManager}
          canDelete={user.isManager && modal.memberId !== user.id}
          onEdit={(m) => setModal({ type: "form", memberId: m.id })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "form" && (
        <MemberFormModal
          member={findMember(modal.memberId)}
          currentUserId={user.id}
          defaultDepartmentId={selected === "all" ? undefined : selected}
          onClose={() => setModal(null)}
          onSaved={(m) => setModal({ type: "detail", memberId: m.id })}
        />
      )}
      {modal?.type === "department" && (
        <DepartmentFormModal
          defaultParentId={selected === "all" ? null : selected}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
