"use client";

import styled from "@emotion/styled";
import { CalendarDays, Check, FileSignature, Heart, MessageCircle, MessagesSquare, Pin } from "lucide-react";
import { transientOptions } from "@/components/ui";
import { EVENT_CATEGORIES } from "@/lib/labels";
import { mq } from "@/styles/theme";

/* ---------- 공통 레이아웃 ---------- */

const Spotlight = styled("section", transientOptions)<{ $muted?: boolean }>`
  padding: 72px 0;
  background: ${({ theme, $muted }) => ($muted ? theme.colors.background : theme.colors.surface)};
  scroll-margin-top: 64px;

  ${mq.md} {
    padding: 96px 0;
  }
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

const Split = styled("div", transientOptions)<{ $reverse?: boolean }>`
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 40px;

  ${mq.lg} {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 64px;

    /* 기본은 설명 → 미리보기, $reverse면 미리보기 → 설명 */
    > :first-of-type {
      order: ${({ $reverse }) => ($reverse ? 1 : 0)};
    }
  }
`;

const Text = styled.div`
  h2 {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: -0.02em;

    ${mq.md} {
      font-size: 34px;
    }
  }

  > p {
    margin-top: 14px;
    font-size: 16px;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Points = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 28px;

  li {
    display: flex;
    gap: 12px;
  }

  li > span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    margin-top: 1px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.successSoft};
    color: ${({ theme }) => theme.colors.success};
  }

  li > span svg {
    width: 14px;
    height: 14px;
  }

  strong {
    display: block;
    font-weight: 700;
  }

  small {
    display: block;
    margin-top: 2px;
    font-size: 14px;
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/** 실제 화면을 단순화한 미리보기 프레임 */
const Mock = styled.div`
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 0;
`;

const MockTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;

  strong {
    font-size: 15px;
    font-weight: 800;
  }

  span {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

interface Point {
  title: string;
  description: string;
}

function PointList({ items }: { items: Point[] }) {
  return (
    <Points>
      {items.map((item) => (
        <li key={item.title}>
          <span>
            <Check />
          </span>
          <div>
            <strong>{item.title}</strong>
            <small>{item.description}</small>
          </div>
        </li>
      ))}
    </Points>
  );
}

/* ---------- 일정관리 미리보기 ---------- */

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 미리보기용 고정 달력 (1일이 수요일인 31일짜리 달) */
const CALENDAR_DAYS = Array.from({ length: 35 }, (_, i) => i - 2);
const CALENDAR_EVENTS: Record<number, { title: string; category: keyof typeof EVENT_CATEGORIES }[]> = {
  3: [{ title: "주간 회의", category: "meeting" }],
  8: [{ title: "치과", category: "personal" }],
  10: [{ title: "주간 회의", category: "meeting" }],
  14: [{ title: "부산 출장", category: "trip" }],
  15: [{ title: "부산 출장", category: "trip" }],
  17: [
    { title: "주간 회의", category: "meeting" },
    { title: "디자인 리뷰", category: "meeting" },
  ],
  21: [{ title: "창립기념일", category: "company" }],
  24: [{ title: "주간 회의", category: "meeting" }],
  28: [{ title: "월간 전체 회의", category: "company" }],
};
const TODAY = 17;

const CalendarLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  ${mq.sm} {
    grid-template-columns: minmax(0, 1fr) 180px;
  }
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  overflow: hidden;
`;

const Weekday = styled("div", transientOptions)<{ $color?: string }>`
  padding: 6px 0;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  color: ${({ theme, $color }) => $color ?? theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Day = styled("div", transientOptions)<{ $today?: boolean; $muted?: boolean }>`
  min-height: 54px;
  padding: 4px;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, $today }) => ($today ? theme.colors.primarySoft : "transparent")};
  opacity: ${({ $muted }) => ($muted ? 0.35 : 1)};

  > b {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
    background: ${({ theme, $today }) => ($today ? theme.colors.primary : "transparent")};
    color: ${({ $today }) => ($today ? "#fff" : "inherit")};
  }
`;

const Chip = styled("span", transientOptions)<{ $color: string }>`
  display: block;
  margin-top: 2px;
  padding: 1px 4px;
  border-radius: 3px;
  overflow: hidden;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: ${({ $color }) => `${$color}1f`};
  color: ${({ $color }) => $color};
`;

const Agenda = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  p {
    font-size: 12px;
    font-weight: 700;
  }
`;

const AgendaItem = styled("div", transientOptions)<{ $color: string }>`
  padding: 8px 10px;
  border-left: 3px solid ${({ $color }) => $color};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: 12px;

  strong {
    display: block;
    font-weight: 600;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
`;

function ScheduleMock() {
  return (
    <Mock aria-hidden>
      <MockTitle>
        <strong>10월</strong>
        <span>개인 · 팀 · 전사 일정</span>
      </MockTitle>
      <CalendarLayout>
        <div>
          <MonthGrid>
            {WEEKDAYS.map((w, i) => (
              <Weekday key={w} $color={i === 0 ? "#e03131" : i === 6 ? "#1c7ed6" : undefined}>
                {w}
              </Weekday>
            ))}
            {CALENDAR_DAYS.map((day) => {
              const inMonth = day >= 1 && day <= 31;
              return (
                <Day key={day} $today={day === TODAY} $muted={!inMonth}>
                  <b>{inMonth ? day : day < 1 ? 30 + day : day - 31}</b>
                  {inMonth &&
                    CALENDAR_EVENTS[day]?.map((e, i) => (
                      <Chip key={i} $color={EVENT_CATEGORIES[e.category].color}>
                        {e.title}
                      </Chip>
                    ))}
                </Day>
              );
            })}
          </MonthGrid>
          <Legend>
            {Object.entries(EVENT_CATEGORIES).map(([key, c]) => (
              <span key={key}>
                <i style={{ background: c.color }} />
                {c.label}
              </span>
            ))}
          </Legend>
        </div>
        <Agenda>
          <p>10월 17일 (금)</p>
          <AgendaItem $color={EVENT_CATEGORIES.meeting.color}>
            <strong>주간 개발 회의</strong>
            <span>10:00 ~ 11:00 · 대회의실</span>
          </AgendaItem>
          <AgendaItem $color={EVENT_CATEGORIES.meeting.color}>
            <strong>디자인 리뷰</strong>
            <span>15:00 ~ 16:00 · 소회의실 A</span>
          </AgendaItem>
          <AgendaItem $color={EVENT_CATEGORIES.company.color}>
            <strong>창립기념일 (휴무)</strong>
            <span>10월 21일 · 종일</span>
          </AgendaItem>
        </Agenda>
      </CalendarLayout>
    </Mock>
  );
}

/* ---------- 전자결재 미리보기 ---------- */

const DocHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-bottom: 14px;

  ${mq.sm} {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  h3 {
    margin-top: 2px;
    font-size: 16px;
    font-weight: 800;
  }
`;

const StampTable = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 72px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
  text-align: center;
  font-size: 11px;

  > div {
    border-right: 1px solid ${({ theme }) => theme.colors.border};
  }

  > div:last-of-type {
    border-right: none;
  }

  p {
    padding: 4px 0;
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textMuted};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  b {
    display: block;
    padding: 6px 0 2px;
    font-weight: 700;
  }
`;

const Stamp = styled("span", transientOptions)<{ $tone: "primary" | "success" | "warning" }>`
  display: inline-block;
  margin: 8px 0 2px;
  padding: 2px 8px;
  border: 1.5px solid ${({ theme, $tone }) => theme.colors[$tone]};
  border-radius: 6px;
  font-weight: 700;
  color: ${({ theme, $tone }) => theme.colors[$tone]};
`;

const DocFields = styled.dl`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  overflow: hidden;
  font-size: 13px;

  dt,
  dd {
    padding: 9px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  dt {
    background: ${({ theme }) => theme.colors.surfaceMuted};
    color: ${({ theme }) => theme.colors.textMuted};
  }

  dt:last-of-type,
  dd:last-of-type {
    border-bottom: none;
  }
`;

const Decision = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.warningSoft};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.warning};

  div {
    display: flex;
    gap: 6px;
  }

  span {
    padding: 6px 12px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 12px;
  }

  span:first-of-type {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.danger};
  }

  span:last-of-type {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }
`;

function ApprovalMock() {
  return (
    <Mock aria-hidden>
      <DocHeader>
        <div>
          <small>GW-2026-0012 · 지출결의서</small>
          <h3>고객사 미팅 식대 정산</h3>
          <small>기안 방문자 · 프론트엔드팀</small>
        </div>
        <StampTable>
          <div>
            <p>기안</p>
            <Stamp $tone="primary">기안</Stamp>
            <b>방문자</b>
          </div>
          <div>
            <p>결재 1</p>
            <Stamp $tone="success">승인</Stamp>
            <b>강태현</b>
          </div>
          <div>
            <p>결재 2</p>
            <Stamp $tone="warning">결재중</Stamp>
            <b>매니저</b>
          </div>
        </StampTable>
      </DocHeader>
      <DocFields>
        <dt>지출일자</dt>
        <dd>2026.10.17</dd>
        <dt>지출금액</dt>
        <dd>86,000원</dd>
        <dt>결제수단</dt>
        <dd>법인카드</dd>
        <dt>지출내역</dt>
        <dd>고객사 미팅 후 저녁 식사 (4인)</dd>
      </DocFields>
      <Decision>
        <strong>매니저님의 결재 차례입니다</strong>
        <div>
          <span>반려</span>
          <span>승인</span>
        </div>
      </Decision>
    </Mock>
  );
}

const Flow = styled.ol`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 28px;
  counter-reset: step;

  ${mq.sm} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  li {
    padding: 12px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.surface};
    font-size: 13px;
    counter-increment: step;
  }

  li::before {
    content: counter(step);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    margin-bottom: 6px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }

  strong {
    display: block;
    font-weight: 700;
  }

  span {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

/* ---------- 게시판 미리보기 ---------- */

const BOARD_POSTS = [
  { category: "정보공유", tone: "primary", title: "점심 맛집 공유합니다 (회사 근처)", author: "오지민", time: "1시간 전", comments: 2, likes: 3 },
  { category: "동호회", tone: "success", title: "사내 러닝 동호회 회원 모집", author: "장현우", time: "어제", comments: 5, likes: 7 },
  { category: "질문", tone: "info", title: "모니터 암 추천 부탁드려요", author: "문지호", time: "2일 전", comments: 1, likes: 0 },
  { category: "자유", tone: "neutral", title: "다들 주말 잘 보내셨나요", author: "조은비", time: "3일 전", comments: 0, likes: 4 },
] as const;

const BoardTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;

  span {
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  span:first-of-type {
    color: ${({ theme }) => theme.colors.primary};
    box-shadow: inset 0 -2px 0 ${({ theme }) => theme.colors.primary};
  }
`;

const PostRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;
  min-width: 0;

  > div {
    flex: 1;
    min-width: 0;
  }

  p {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-weight: 600;
  }

  small {
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Category = styled("span", transientOptions)<{ $tone: string }>`
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ theme, $tone }) =>
    $tone === "primary"
      ? theme.colors.primarySoft
      : $tone === "success"
        ? theme.colors.successSoft
        : $tone === "info"
          ? theme.colors.infoSoft
          : theme.colors.surfaceHover};
  color: ${({ theme, $tone }) =>
    $tone === "primary"
      ? theme.colors.primary
      : $tone === "success"
        ? theme.colors.success
        : $tone === "info"
          ? theme.colors.info
          : theme.colors.textMuted};
`;

const Counts = styled.span`
  display: none;
  flex-shrink: 0;
  gap: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};

  ${mq.sm} {
    display: inline-flex;
  }

  span {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }

  svg {
    width: 13px;
    height: 13px;
  }
`;

const CommentPreview = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;
  padding: 12px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surfaceMuted};
  font-size: 13px;

  i {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 11px;
    font-style: normal;
    font-weight: 700;
    background: #0ca678;
    color: #fff;
  }

  strong {
    font-weight: 700;
  }

  small {
    margin-left: 6px;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.textSubtle};
  }

  p {
    margin-top: 2px;
  }
`;

const PinnedNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  background: ${({ theme }) => theme.colors.primarySoft};
  color: ${({ theme }) => theme.colors.primary};

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

function BoardMock() {
  return (
    <Mock aria-hidden>
      <MockTitle>
        <strong>게시판</strong>
        <span>소속 직원 전용</span>
      </MockTitle>
      <BoardTabs>
        <span>전체</span>
        <span>자유</span>
        <span>질문</span>
        <span>정보공유</span>
        <span>동호회</span>
      </BoardTabs>
      <PinnedNotice>
        <Pin />
        [공지] 하반기 보안 교육 이수 안내
      </PinnedNotice>
      {BOARD_POSTS.map((post) => (
        <PostRow key={post.title}>
          <Category $tone={post.tone}>{post.category}</Category>
          <div>
            <p>
              {post.title}
              {post.comments > 0 && ` [${post.comments}]`}
            </p>
            <small>
              {post.author} · {post.time}
            </small>
          </div>
          <Counts>
            <span>
              <MessageCircle />
              {post.comments}
            </span>
            <span>
              <Heart />
              {post.likes}
            </span>
          </Counts>
        </PostRow>
      ))}
      <CommentPreview>
        <i>방</i>
        <div>
          <strong>방문자</strong>
          <small>방금 전</small>
          <p>오 내일 점심에 가봐야겠네요 👍</p>
        </div>
      </CommentPreview>
    </Mock>
  );
}

/* ---------- 섹션 ---------- */

export function FeatureSpotlights() {
  return (
    <>
      <Spotlight id="schedule">
        <Container>
          <Split>
            <Text>
              <Eyebrow>
                <CalendarDays />
                일정관리
              </Eyebrow>
              <h2>
                팀의 하루를
                <br />
                캘린더 하나로 맞춥니다
              </h2>
              <p>
                회의, 개인 일정, 출장, 전사 행사까지 한 캘린더에서 색으로 구분해 봅니다. 누가 언제 자리를 비우는지 미리 알 수
                있어 일정 조율이 쉬워집니다.
              </p>
              <PointList
                items={[
                  {
                    title: "카테고리별 색상 구분",
                    description: "회의·개인·전사·출장 일정을 색으로 나누고, 필요한 종류만 골라 볼 수 있습니다.",
                  },
                  {
                    title: "공개 범위 설정",
                    description: "전사 공개 일정은 모든 구성원에게, 개인 일정은 나에게만 보입니다.",
                  },
                  {
                    title: "회의실 예약과 함께",
                    description: "회의 일정을 잡으면서 시간표에서 비어 있는 회의실을 바로 예약합니다.",
                  },
                  {
                    title: "오늘 일정 알림",
                    description: "대시보드와 상단 알림에서 오늘의 일정을 놓치지 않게 알려 줍니다.",
                  },
                ]}
              />
            </Text>
            <ScheduleMock />
          </Split>
        </Container>
      </Spotlight>

      <Spotlight id="approval" $muted>
        <Container>
          <Split $reverse>
            <Text>
              <Eyebrow>
                <FileSignature />
                전자결재
              </Eyebrow>
              <h2>
                종이 결재 없이,
                <br />
                양식 선택부터 승인까지
              </h2>
              <p>
                매니저가 회사에 맞는 양식과 결재선을 미리 등록해 두면, 직원은 내용만 작성해 올리면 됩니다. 결재자는 알림을 받고
                바로 승인하거나 의견과 함께 반려합니다.
              </p>
              <PointList
                items={[
                  {
                    title: "회사 맞춤 양식",
                    description: "지출결의서, 품의서, 출장 신청서 등 입력 항목을 회사에 맞게 구성합니다.",
                  },
                  {
                    title: "결재선 자동 지정",
                    description: "양식마다 정해진 결재 순서가 자동으로 적용되어 누구에게 올릴지 고민할 필요가 없습니다.",
                  },
                  {
                    title: "결재란과 이력 보관",
                    description: "도장 형태의 결재란과 의견·처리 시각이 문서에 남아 언제든 다시 확인할 수 있습니다.",
                  },
                ]}
              />
              <Flow>
                <li>
                  <strong>양식 선택</strong>
                  <span>등록된 양식 중 선택</span>
                </li>
                <li>
                  <strong>내용 작성</strong>
                  <span>결재선 자동 지정</span>
                </li>
                <li>
                  <strong>순차 결재</strong>
                  <span>승인 · 반려 의견</span>
                </li>
                <li>
                  <strong>완료 · 보관</strong>
                  <span>이력과 함께 보관</span>
                </li>
              </Flow>
            </Text>
            <ApprovalMock />
          </Split>
        </Container>
      </Spotlight>

      <Spotlight id="board">
        <Container>
          <Split>
            <Text>
              <Eyebrow>
                <MessagesSquare />
                게시판
              </Eyebrow>
              <h2>
                동료와 나누는
                <br />
                우리 회사만의 이야기
              </h2>
              <p>
                업무 정보부터 점심 맛집, 동호회 모집까지. 같은 회사 구성원끼리만 보는 공간이라 편하게 묻고 답할 수 있습니다.
              </p>
              <PointList
                items={[
                  {
                    title: "주제별 분류",
                    description: "자유·질문·정보공유·동호회로 나눠 원하는 글을 빠르게 찾습니다.",
                  },
                  {
                    title: "댓글과 좋아요",
                    description: "댓글로 바로 답하고, 좋아요로 가볍게 공감을 표현합니다.",
                  },
                  {
                    title: "공지사항과 분리",
                    description: "관리자 공지는 별도 메뉴에서 상단 고정으로 관리해 중요한 소식이 묻히지 않습니다.",
                  },
                  {
                    title: "회사별 독립 공간",
                    description: "다른 회사 구성원은 볼 수 없는, 소속 직원만을 위한 게시판입니다.",
                  },
                ]}
              />
            </Text>
            <BoardMock />
          </Split>
        </Container>
      </Spotlight>
    </>
  );
}
