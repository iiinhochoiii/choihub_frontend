import {
  Building2,
  CalendarDays,
  Clock,
  DoorOpen,
  FileSignature,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Settings2,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** true면 매니저에게만 메뉴 노출 */
  managerOnly?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "홈",
    items: [{ href: "/dashboard", label: "대시보드", icon: LayoutDashboard }],
  },
  {
    title: "업무",
    items: [
      { href: "/dashboard/attendance", label: "근태관리", icon: Clock },
      { href: "/dashboard/schedule", label: "일정관리", icon: CalendarDays },
      { href: "/dashboard/tasks", label: "업무관리", icon: KanbanSquare },
      { href: "/dashboard/approval", label: "전자결재", icon: FileSignature },
      { href: "/dashboard/reservations", label: "회의실 예약", icon: DoorOpen },
    ],
  },
  {
    title: "소통",
    items: [
      { href: "/dashboard/notices", label: "공지사항", icon: Megaphone },
      { href: "/dashboard/board", label: "게시판", icon: MessagesSquare },
      { href: "/dashboard/members", label: "구성원", icon: Users },
      { href: "/dashboard/archive", label: "자료실", icon: FolderOpen },
    ],
  },
  {
    title: "회사",
    items: [
      { href: "/dashboard/company", label: "회사정보", icon: Building2 },
      { href: "/dashboard/approval/forms", label: "결재 양식 관리", icon: Settings2, managerOnly: true },
    ],
  },
];

/** 현재 경로에 가장 길게 일치하는 메뉴를 활성으로 본다. */
export function findActiveHref(pathname: string): string | undefined {
  const all = NAV_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
  return all
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
}
