"use client";

import styled from "@emotion/styled";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/common/LogoMark";
import { transientOptions } from "@/components/ui";
import { mq } from "@/styles/theme";
import { useApprovalPendingCount } from "@/queries/approval";
import { useCurrentUser } from "@/queries/auth";
import { useCompany } from "@/queries/directory";
import { findActiveHref, NAV_SECTIONS } from "./navigation";

const Aside = styled("aside", transientOptions)<{ $open: boolean }>`
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: ${({ theme }) => theme.layout.sidebarWidth};
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  transform: translateX(${({ $open }) => ($open ? "0" : "-100%")});
  transition: transform 0.2s ease;

  ${mq.lg} {
    transform: none;
  }
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  height: ${({ theme }) => theme.layout.topbarHeight};
  padding: 0 20px;
  flex-shrink: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  strong {
    font-size: 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  small {
    display: block;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }
`;

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
`;

const SectionTitle = styled.p`
  padding: 14px 10px 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  transition:
    background-color 0.15s,
    color 0.15s;

  svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
    color: ${({ theme }) => theme.colors.text};
  }

  &[aria-current="page"] {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }
`;

const Count = styled.span`
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  background: ${({ theme }) => theme.colors.danger};
  color: #fff;
`;

const Footer = styled.div`
  padding: 14px 20px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  background: ${({ theme }) => theme.colors.overlay};

  ${mq.lg} {
    display: none;
  }
`;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const company = useCompany();
  const user = useCurrentUser();
  const { data: pendingCount = 0 } = useApprovalPendingCount();
  const activeHref = findActiveHref(pathname);

  const badges: Record<string, number> = {
    "/dashboard/approval": pendingCount,
  };

  return (
    <>
      {open && <Backdrop onClick={onClose} />}
      <Aside $open={open} aria-label="주 메뉴">
        <Brand href="/dashboard" onClick={onClose}>
          <LogoMark size={30} />
          <div>
            <strong>ChoiHub</strong>
            <small>{company.name}</small>
          </div>
        </Brand>
        <Nav>
          {NAV_SECTIONS.map((section) => {
            const items = section.items.filter((item) => !item.managerOnly || user.isManager);
            if (items.length === 0) return null;
            return (
              <div key={section.title}>
                <SectionTitle>{section.title}</SectionTitle>
                <ul>
                  {items.map(({ href, label, icon: Icon }) => (
                    <li key={href}>
                      <NavLink
                        href={href}
                        aria-current={activeHref === href ? "page" : undefined}
                        onClick={onClose}
                      >
                        <Icon />
                        {label}
                        {!!badges[href] && <Count>{badges[href]}</Count>}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Nav>
        <Footer>© {new Date().getFullYear()} {company.name}</Footer>
      </Aside>
    </>
  );
}
