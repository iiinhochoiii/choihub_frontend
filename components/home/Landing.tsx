"use client";

import styled from "@emotion/styled";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock,
  DoorOpen,
  FileSignature,
  FolderOpen,
  KanbanSquare,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { GithubIcon } from "@/components/common/GithubIcon";
import { LogoMark } from "@/components/common/LogoMark";
import { ButtonLink, transientOptions } from "@/components/ui";
import { useAuth } from "@/queries/auth";
import { FeatureSpotlights } from "./FeatureSpotlights";
import { mq } from "@/styles/theme";

const FEATURES = [
  { icon: Clock, title: "근태관리", description: "출퇴근 기록과 근무시간, 남은 연차를 한눈에 확인하고 휴가를 신청합니다." },
  { icon: CalendarDays, title: "일정관리", description: "개인·팀·전사 일정을 캘린더에서 등록하고 공유합니다." },
  { icon: FileSignature, title: "전자결재", description: "매니저가 등록한 양식과 결재선으로 문서를 기안하고 승인합니다." },
  { icon: Megaphone, title: "공지사항", description: "관리자가 등록한 전사 공지를 놓치지 않도록 상단 고정과 알림을 제공합니다." },
  { icon: MessagesSquare, title: "게시판", description: "동료들과 정보를 나누고 댓글과 좋아요로 소통합니다." },
  { icon: Users, title: "구성원 · 조직도", description: "부서별 조직도와 구성원 연락처, 근무 상태를 확인합니다." },
  { icon: KanbanSquare, title: "업무관리", description: "칸반 보드로 업무를 할당하고 진행 상황을 추적합니다." },
  { icon: DoorOpen, title: "회의실 예약", description: "회의실 사용 현황을 타임라인으로 보고 겹침 없이 예약합니다." },
  { icon: FolderOpen, title: "자료실", description: "규정, 양식, 가이드 문서를 폴더별로 정리해 공유합니다." },
  { icon: Building2, title: "회사정보 관리", description: "회사명, 사업자번호, 연락처, 근무시간 등 기본 정보를 관리합니다." },
];

const ROLES = [
  {
    icon: ShieldCheck,
    title: "매니저",
    description: "조직 운영에 필요한 설정을 직접 관리합니다.",
    items: [
      "결재 양식 등록 · 결재선(승인 플로우) 지정",
      "회사정보 등록 및 수정",
      "공지사항 작성 · 상단 고정",
      "휴가 승인과 팀 근태 현황 확인",
      "구성원 추가 · 권한 관리",
    ],
  },
  {
    icon: UserRound,
    title: "직원",
    description: "정해진 규칙 안에서 빠르게 업무를 처리합니다.",
    items: [
      "출퇴근 기록 · 연차 확인 및 휴가 신청",
      "등록된 양식으로 결재 기안 (양식 변경 불가)",
      "캘린더 일정 등록 · 회의실 예약",
      "게시판 글쓰기 · 댓글",
      "조직도와 동료 연락처 조회",
    ],
  },
];

const Page = styled.div`
  background: ${({ theme }) => theme.colors.surface};
`;

const Container = styled.div`
  width: 100%;
  max-width: 1160px;
  margin: 0 auto;
  padding: 0 16px;

  ${mq.md} {
    padding: 0 32px;
  }
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, ${({ theme }) => theme.colors.surface} 85%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderInner = styled(Container)`
  display: flex;
  align-items: center;
  gap: 24px;
  height: 64px;
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const HeaderNav = styled.nav`
  display: none;
  gap: 24px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;

  a:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  ${mq.md} {
    display: flex;
  }
`;

const HeaderAction = styled.div`
  margin-left: auto;
`;

const Hero = styled.section`
  padding: 72px 0 56px;
  background: radial-gradient(
      ellipse 80% 60% at 50% 0%,
      ${({ theme }) => theme.colors.primarySoft},
      transparent
    ),
    ${({ theme }) => theme.colors.surface};

  ${mq.md} {
    padding: 104px 0 80px;
  }
`;

const HeroText = styled.div`
  max-width: 720px;
  margin: 0 auto;
  text-align: center;

  h1 {
    font-size: 36px;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: -0.03em;

    ${mq.md} {
      font-size: 52px;
    }

    em {
      font-style: normal;
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  p {
    margin-top: 20px;
    font-size: 17px;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Eyebrow = styled.span`
  display: inline-block;
  margin-bottom: 16px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};
`;

const HeroActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
`;

const Preview = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-width: 960px;
  margin: 56px auto 0;
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  ${mq.md} {
    grid-template-columns: 180px 1fr;
  }
`;

const PreviewNav = styled.div`
  display: none;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};

  ${mq.md} {
    display: flex;
  }

  span {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  span:first-of-type {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const PreviewMain = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  ${mq.md} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const PreviewStat = styled.div`
  padding: 14px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  text-align: left;

  small {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 4px;
    font-size: 22px;
    font-weight: 800;
  }
`;

const PreviewPanel = styled.div`
  grid-column: span 2;
  padding: 14px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  text-align: left;

  p {
    margin-bottom: 10px;
    font-size: 12px;
    font-weight: 700;
  }

  i {
    display: block;
    height: 8px;
    margin-top: 8px;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const Section = styled("section", transientOptions)<{ $muted?: boolean }>`
  scroll-margin-top: 64px;
  padding: 72px 0;
  background: ${({ theme, $muted }) => ($muted ? theme.colors.background : theme.colors.surface)};

  ${mq.md} {
    padding: 96px 0;
  }
`;

const SectionHead = styled.div`
  max-width: 640px;
  margin: 0 auto 48px;
  text-align: center;

  h2 {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;

    ${mq.md} {
      font-size: 34px;
    }
  }

  p {
    margin-top: 12px;
    font-size: 16px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${mq.sm} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${mq.lg} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  ${mq.xl} {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

const FeatureCard = styled.div`
  padding: 22px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 14px;
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 20px;
    height: 20px;
  }

  h3 {
    font-size: 16px;
    font-weight: 700;
  }

  p {
    margin-top: 6px;
    font-size: 14px;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  max-width: 900px;
  margin: 0 auto;

  ${mq.md} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const RoleCard = styled.div`
  padding: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.surface};

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  header svg {
    width: 26px;
    height: 26px;
    color: ${({ theme }) => theme.colors.primary};
  }

  h3 {
    font-size: 20px;
    font-weight: 800;
  }

  > p {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  li svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    color: ${({ theme }) => theme.colors.success};
  }
`;

const Cta = styled.div`
  padding: 48px 24px;
  border-radius: 24px;
  text-align: center;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;

  h2 {
    font-size: 26px;
    font-weight: 800;

    ${mq.md} {
      font-size: 32px;
    }
  }

  p {
    margin: 12px 0 28px;
    opacity: 0.85;
  }
`;

const CtaButton = styled(ButtonLink)`
  background: #fff;
  color: ${({ theme }) => theme.colors.primary};

  &:hover:not(:disabled) {
    background: #eef1ff;
  }
`;

const Footer = styled.footer`
  padding: 32px 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSubtle};

  p + p {
    margin-top: 4px;
  }
`;

const FooterInner = styled(Container)`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  ${mq.md} {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
`;

const SocialLink = styled.a`
  display: inline-flex;
  color: ${({ theme }) => theme.colors.textSubtle};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const CONTACT_EMAIL = "dlsgh120@gmail.com";
// TODO: GitHub 주소 입력
const GITHUB_URL = "https://github.com/iiinhochoiii/choihub_frontend";

export function Landing() {
  const { user } = useAuth();
  const startHref = user ? "/dashboard" : "/login";
  const startLabel = user ? "대시보드로 이동" : "로그인";

  return (
    <Page>
      <Header>
        <HeaderInner>
          <Logo href="#top">
            <LogoMark size={30} />
            ChoiHub
          </Logo>
          <HeaderNav aria-label="소개 메뉴">
            <a href="#features">주요 기능</a>
            <a href="#schedule">일정관리</a>
            <a href="#approval">전자결재</a>
            <a href="#board">게시판</a>
            <a href="#roles">권한</a>
          </HeaderNav>
          <HeaderAction>
            <ButtonLink href={startHref} $size="sm">
              {startLabel}
            </ButtonLink>
          </HeaderAction>
        </HeaderInner>
      </Header>

      <main id="top">
        <Hero>
          <Container>
            <HeroText>
              <Eyebrow>올인원 그룹웨어</Eyebrow>
              <h1>
                흩어진 회사 업무를
                <br />
                <em>하나의 공간</em>에서
              </h1>
              <p>
                근태, 일정, 전자결재, 공지사항, 게시판, 조직도까지.
                <br />
                ChoiHub에서 팀의 하루를 한 화면으로 관리하세요.
              </p>
              <HeroActions>
                <ButtonLink href={startHref} $size="lg">
                  {user ? "대시보드로 이동" : "지금 시작하기"}
                  <ArrowRight />
                </ButtonLink>
                <ButtonLink href="#features" $size="lg" $variant="secondary">
                  기능 살펴보기
                </ButtonLink>
              </HeroActions>
            </HeroText>

            <Preview aria-hidden>
              <PreviewNav>
                <span>
                  <LayoutDashboard /> 대시보드
                </span>
                <span>
                  <Clock /> 근태관리
                </span>
                <span>
                  <CalendarDays /> 일정관리
                </span>
                <span>
                  <FileSignature /> 전자결재
                </span>
                <span>
                  <Megaphone /> 공지사항
                </span>
              </PreviewNav>
              <PreviewMain>
                <PreviewStat>
                  <small>남은 연차</small>
                  <strong>12.5일</strong>
                </PreviewStat>
                <PreviewStat>
                  <small>결재 대기</small>
                  <strong>3건</strong>
                </PreviewStat>
                <PreviewStat>
                  <small>오늘 일정</small>
                  <strong>2개</strong>
                </PreviewStat>
                <PreviewStat>
                  <small>진행 업무</small>
                  <strong>5개</strong>
                </PreviewStat>
                <PreviewPanel>
                  <p>최근 공지사항</p>
                  <i style={{ width: "92%" }} />
                  <i style={{ width: "76%" }} />
                  <i style={{ width: "84%" }} />
                </PreviewPanel>
                <PreviewPanel>
                  <p>오늘 일정</p>
                  <i style={{ width: "68%" }} />
                  <i style={{ width: "88%" }} />
                  <i style={{ width: "54%" }} />
                </PreviewPanel>
              </PreviewMain>
            </Preview>
          </Container>
        </Hero>

        <Section id="features" $muted>
          <Container>
            <SectionHead>
              <h2>업무에 필요한 모든 메뉴</h2>
              <p>로그인 한 번으로 회사 생활에 필요한 기능을 모두 사용할 수 있습니다.</p>
            </SectionHead>
            <FeatureGrid>
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <FeatureCard key={title}>
                  <span>
                    <Icon />
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </FeatureCard>
              ))}
            </FeatureGrid>
          </Container>
        </Section>

        <FeatureSpotlights />

        <Section id="roles" $muted>
          <Container>
            <SectionHead>
              <h2>역할에 맞는 권한</h2>
              <p>매니저는 규칙을 만들고, 직원은 그 규칙 안에서 빠르게 일합니다.</p>
            </SectionHead>
            <RoleGrid>
              {ROLES.map(({ icon: Icon, title, description, items }) => (
                <RoleCard key={title}>
                  <header>
                    <Icon />
                    <h3>{title}</h3>
                  </header>
                  <p>{description}</p>
                  <ul>
                    {items.map((item) => (
                      <li key={item}>
                        <Check />
                        {item}
                      </li>
                    ))}
                  </ul>
                </RoleCard>
              ))}
            </RoleGrid>
          </Container>
        </Section>

        <Section>
          <Container>
            <Cta>
              <h2>지금 바로 시작해 보세요</h2>
              <p>데모 계정으로 매니저와 직원 화면을 모두 체험할 수 있습니다.</p>
              <CtaButton href={startHref} $size="lg">
                {startLabel}
                <ArrowRight />
              </CtaButton>
            </Cta>
          </Container>
        </Section>
      </main>

      <Footer>
        <FooterInner>
          <div>
            <p>
              ChoiHub. 올인원 그룹웨어 · <a href="/login">데모 로그인</a> ·{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>문의하기</a>
            </p>
            <p>Copyright © 2026 by ChoiHub. All rights reserved.</p>
          </div>
          <SocialLink href={GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
            <GithubIcon />
          </SocialLink>
        </FooterInner>
      </Footer>
    </Page>
  );
}
