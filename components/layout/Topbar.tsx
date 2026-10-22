"use client";

import styled from "@emotion/styled";
import { Bell, CalendarDays, ChevronDown, FileSignature, LogOut, Megaphone, Menu, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, Badge, IconButton } from "@/components/ui";
import { formatRelative, isWithinDays, todayKey } from "@/lib/date";
import { ROLE_LABELS } from "@/lib/labels";
import { useApprovalDocs } from "@/queries/approval";
import { useAuth, useCurrentUser } from "@/queries/auth";
import { useCompany, useDirectory } from "@/queries/directory";
import { useEvents } from "@/queries/events";
import { useNotices } from "@/queries/notices";
import { mq } from "@/styles/theme";

const Bar = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 8px;
  height: ${({ theme }) => theme.layout.topbarHeight};
  padding: 0 16px;
  background: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  ${mq.md} {
    padding: 0 24px;
  }
`;

const MenuButton = styled(IconButton)`
  ${mq.lg} {
    display: none;
  }
`;

const CompanyName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
`;

const Anchor = styled.div`
  position: relative;
`;

const BellDot = styled.span`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.danger};
  border: 2px solid ${({ theme }) => theme.colors.surface};
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  width: 320px;
  max-width: calc(100vw - 32px);
  padding: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
`;

const DropdownTitle = styled.p`
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 700;
`;

const DropdownItem = styled(Link)`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  svg {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.primary};
  }

  small {
    display: block;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  text-align: left;
  color: ${({ theme }) => theme.colors.danger};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Empty = styled.p`
  padding: 20px 10px;
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 8px 0 4px;
  border-radius: ${({ theme }) => theme.radii.full};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }

  > span:nth-of-type(2) {
    display: none;
    text-align: left;
    line-height: 1.2;

    ${mq.md} {
      display: block;
    }
  }

  strong {
    display: block;
    font-size: 13px;
  }

  small {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  > svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

interface PopoverProps {
  trigger: (toggle: () => void) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
}

/** 바깥 클릭 시 닫히는 드롭다운 */
function Popover({ trigger, children }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <Anchor ref={ref}>
      {trigger(() => setOpen((v) => !v))}
      {open && children(() => setOpen(false))}
    </Anchor>
  );
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const company = useCompany();
  const { getDepartmentName } = useDirectory();
  const { logout } = useAuth();
  const user = useCurrentUser();

  // 알림은 부가 정보라 불러오는 중이거나 실패하면 해당 항목을 비워 둔다.
  const today = todayKey();
  const { data: pendingDocs = [] } = useApprovalDocs("pending");
  const { data: todayEvents = [] } = useEvents({ from: today, to: today });
  const { data: noticePage } = useNotices();

  const items = [
    // 결재 대기함: 내 결재 차례인 문서 (서버가 거른다)
    ...pendingDocs.map((doc) => ({
      key: doc.id,
      href: `/dashboard/approval/${doc.id}`,
      icon: <FileSignature />,
      text: `결재 요청: ${doc.title}`,
      time: formatRelative(doc.createdAt),
    })),
    // 공유 일정과 내 일정만 내려온다.
    ...todayEvents.map((e) => ({
      key: e.id,
      href: "/dashboard/schedule",
      icon: <CalendarDays />,
      text: `오늘 일정: ${e.title}`,
      time: e.allDay ? "종일" : `${e.startTime} ~ ${e.endTime}`,
    })),
    // 공지 목록 첫 페이지 중 최근 3일 이내 글
    ...(noticePage?.items ?? [])
      .filter((n) => isWithinDays(n.createdAt, 3))
      .map((n) => ({
        key: n.id,
        href: `/dashboard/notices/${n.id}`,
        icon: <Megaphone />,
        text: `새 공지: ${n.title}`,
        time: formatRelative(n.createdAt),
      })),
  ];

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <Bar>
      <MenuButton onClick={onMenuClick} aria-label="메뉴 열기">
        <Menu />
      </MenuButton>
      <CompanyName>{company.name}</CompanyName>

      <Right>
        <Popover
          trigger={(toggle) => (
            <>
              <IconButton $size={40} aria-label={`알림 ${items.length}건`} onClick={toggle}>
                <Bell />
              </IconButton>
              {items.length > 0 && <BellDot />}
            </>
          )}
        >
          {(close) => (
            <Dropdown>
              <DropdownTitle>알림 {items.length}건</DropdownTitle>
              {items.length === 0 ? (
                <Empty>새 알림이 없습니다.</Empty>
              ) : (
                items.map((item) => (
                  <DropdownItem key={item.key} href={item.href} onClick={close}>
                    {item.icon}
                    <span>
                      {item.text}
                      <small>{item.time}</small>
                    </span>
                  </DropdownItem>
                ))
              )}
            </Dropdown>
          )}
        </Popover>

        <Popover
          trigger={(toggle) => (
            <UserButton onClick={toggle} aria-label="내 계정 메뉴">
              <Avatar name={user.name} color={user.color} size={32} />
              <span>
                <strong>{user.name}</strong>
                <small>
                  {getDepartmentName(user.departmentId)} · {user.position}
                </small>
              </span>
              <ChevronDown />
            </UserButton>
          )}
        >
          {(close) => (
            <Dropdown style={{ width: 240 }}>
              <ProfileHeader>
                <Avatar name={user.name} color={user.color} size={36} />
                <div>
                  <strong>{user.name}</strong>{" "}
                  <Badge $tone={user.isManager ? "primary" : "neutral"}>{ROLE_LABELS[user.role]}</Badge>
                  <small>{user.email}</small>
                </div>
              </ProfileHeader>
              <DropdownItem href="/dashboard/profile" onClick={close}>
                <UserCog />내 정보
              </DropdownItem>
              <DropdownButton type="button" onClick={handleLogout}>
                <LogOut />
                로그아웃
              </DropdownButton>
            </Dropdown>
          )}
        </Popover>
      </Right>
    </Bar>
  );
}
