"use client";

import styled from "@emotion/styled";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  DoorOpen,
  FileSignature,
  KanbanSquare,
  LogIn,
  LogOut,
  Megaphone,
  MessagesSquare,
  Pin,
  Plane,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  CardLink,
  CardTitle,
  Dot,
  EmptyState,
  StatusBadge,
  transientOptions,
} from "@/components/ui";
import { getCurrentStep, isMyTurn } from "@/lib/approval";
import { ATTENDANCE_STATUS, getAttendanceStatus, getUsedLeaveDays } from "@/lib/attendance";
import { formatDate, formatLongDate, formatMonthDay, formatRelative, nowTime, toDateKey } from "@/lib/date";
import { createId } from "@/lib/id";
import {
  APPROVAL_DOC_STATUS,
  EVENT_CATEGORIES,
  MEMBER_STATUS,
  NOTICE_CATEGORIES,
  TASK_PRIORITY,
  TASK_STATUS,
} from "@/lib/labels";
import { getMemberName, getRoomName } from "@/lib/selectors";
import { useCurrentUser, useData } from "@/lib/store";
import type { MemberStatus } from "@/lib/types";
import { mq } from "@/styles/theme";

const Greeting = styled.div`
  margin-bottom: 24px;

  p {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  h1 {
    margin-top: 4px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  ${mq.md} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${mq.xl} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;

  ${mq.lg} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const StatCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition: border-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  > span {
    display: none;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.primary};

    ${mq.sm} {
      display: inline-flex;
    }
  }

  svg {
    width: 22px;
    height: 22px;
  }

  small {
    font-size: 13px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    display: block;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }

  em {
    margin-left: 2px;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const AttendanceCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primarySoft}, ${({ theme }) => theme.colors.surface});
`;

const TimeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  div {
    padding: 12px;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }

  small {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    display: block;
    margin-top: 2px;
    font-size: 20px;
    font-weight: 700;
    font-family: ${({ theme }) => theme.fonts.mono};
  }
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
`;

const ListItem = styled.li`
  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const ListLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 4px;
  min-width: 0;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const ListText = styled.div`
  flex: 1;
  min-width: 0;

  p {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  small {
    display: block;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const Meta = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSubtle};
`;

const DateBox = styled("div", transientOptions)<{ $color: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  border-left: 3px solid ${({ $color }) => $color};
  background: ${({ theme }) => theme.colors.surfaceMuted};
  line-height: 1.1;

  small {
    font-size: 10px;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  strong {
    font-size: 15px;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.surfaceMuted};
  }

  strong {
    font-size: 18px;
  }
`;

const AvatarStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
`;

function SectionLink({ href }: { href: string }) {
  return (
    <Link href={href}>
      <CardLink>
        전체보기 <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
      </CardLink>
    </Link>
  );
}

export function DashboardHome() {
  const { data, update } = useData();
  const user = useCurrentUser();
  const [now] = useState(() => new Date());
  const today = toDateKey(now);

  const record = data.attendance.find((a) => a.memberId === user.id && a.date === today);
  const attendanceStatus = getAttendanceStatus(record, data.company);
  const leaveRemaining = user.annualLeaveTotal - getUsedLeaveDays(data.leaveRequests, user.id, now.getFullYear());

  const myTurnDocs = data.approvalDocs.filter((d) => isMyTurn(d, user.id));
  const myDrafts = data.approvalDocs
    .filter((d) => d.drafterId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const approvalList = [...myTurnDocs, ...myDrafts.filter((d) => !myTurnDocs.includes(d))].slice(0, 5);

  const visibleEvents = data.events
    .filter((e) => (e.shared || e.ownerId === user.id) && e.date >= today)
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const todayEventCount = visibleEvents.filter((e) => e.date === today).length;

  const myTasks = data.tasks
    .filter((t) => t.assigneeId === user.id && t.status !== "done")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const notices = [...data.notices]
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const posts = [...data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  const todayReservations = data.reservations
    .filter((r) => r.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const statusCounts = (Object.keys(MEMBER_STATUS) as MemberStatus[]).map((status) => ({
    status,
    count: data.members.filter((m) => m.status === status).length,
  }));
  const onLeave = data.members.filter((m) => m.status === "leave");

  const checkIn = () => {
    const time = nowTime();
    update((prev) => ({
      ...prev,
      attendance: [
        ...prev.attendance,
        { id: createId("a"), memberId: user.id, date: today, checkIn: time, checkOut: null },
      ],
    }));
  };

  const checkOut = () => {
    if (!record) return;
    const time = nowTime();
    update((prev) => ({
      ...prev,
      attendance: prev.attendance.map((a) => (a.id === record.id ? { ...a, checkOut: time } : a)),
    }));
  };

  return (
    <>
      <Greeting>
        <p>{formatLongDate(now)}</p>
        <h1>안녕하세요, {user.name}님 👋</h1>
      </Greeting>

      <StatGrid>
        <StatCard href="/dashboard/attendance">
          <span>
            <Plane />
          </span>
          <div>
            <small>남은 연차</small>
            <strong>
              {leaveRemaining}
              <em>/ {user.annualLeaveTotal}일</em>
            </strong>
          </div>
        </StatCard>
        <StatCard href="/dashboard/approval">
          <span>
            <FileSignature />
          </span>
          <div>
            <small>결재 대기</small>
            <strong>
              {myTurnDocs.length}
              <em>건</em>
            </strong>
          </div>
        </StatCard>
        <StatCard href="/dashboard/schedule">
          <span>
            <CalendarDays />
          </span>
          <div>
            <small>오늘 일정</small>
            <strong>
              {todayEventCount}
              <em>개</em>
            </strong>
          </div>
        </StatCard>
        <StatCard href="/dashboard/tasks">
          <span>
            <KanbanSquare />
          </span>
          <div>
            <small>진행 업무</small>
            <strong>
              {myTasks.length}
              <em>개</em>
            </strong>
          </div>
        </StatCard>
      </StatGrid>

      <Grid>
        <AttendanceCard>
          <CardHeader style={{ marginBottom: 0 }}>
            <CardTitle>
              <Clock />
              오늘의 근태
            </CardTitle>
            <StatusBadge value={ATTENDANCE_STATUS[attendanceStatus]} />
          </CardHeader>
          <TimeRow>
            <div>
              <small>출근</small>
              <strong>{record?.checkIn ?? "--:--"}</strong>
            </div>
            <div>
              <small>퇴근</small>
              <strong>{record?.checkOut ?? "--:--"}</strong>
            </div>
          </TimeRow>
          {!record?.checkIn ? (
            <Button $block onClick={checkIn}>
              <LogIn />
              출근하기
            </Button>
          ) : !record.checkOut ? (
            <Button $block $variant="secondary" onClick={checkOut}>
              <LogOut />
              퇴근하기
            </Button>
          ) : (
            <Button $block $variant="secondary" disabled>
              오늘 근무를 마쳤습니다
            </Button>
          )}
          <small style={{ color: "inherit", opacity: 0.6, fontSize: 12 }}>
            근무시간 {data.company.workStart} ~ {data.company.workEnd}
          </small>
        </AttendanceCard>

        <Card>
          <CardHeader>
            <CardTitle>
              <FileSignature />
              전자결재
            </CardTitle>
            <SectionLink href="/dashboard/approval" />
          </CardHeader>
          {approvalList.length === 0 ? (
            <EmptyState title="진행 중인 결재가 없습니다" />
          ) : (
            <List>
              {approvalList.map((doc) => {
                const current = getCurrentStep(doc);
                const mine = isMyTurn(doc, user.id);
                return (
                  <ListItem key={doc.id}>
                    <ListLink href={`/dashboard/approval/${doc.id}`}>
                      <ListText>
                        <p>{doc.title}</p>
                        <small>
                          {doc.formName} · {getMemberName(data, doc.drafterId)}
                          {current && ` → ${getMemberName(data, current.approverId)}`}
                        </small>
                      </ListText>
                      {mine ? (
                        <Badge $tone="warning">내 차례</Badge>
                      ) : (
                        <StatusBadge value={APPROVAL_DOC_STATUS[doc.status]} />
                      )}
                    </ListLink>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CalendarDays />
              다가오는 일정
            </CardTitle>
            <SectionLink href="/dashboard/schedule" />
          </CardHeader>
          {visibleEvents.length === 0 ? (
            <EmptyState title="예정된 일정이 없습니다" />
          ) : (
            <List>
              {visibleEvents.slice(0, 5).map((event) => {
                const [, month, day] = event.date.split("-");
                return (
                  <ListItem key={event.id}>
                    <ListLink href="/dashboard/schedule">
                      <DateBox $color={EVENT_CATEGORIES[event.category].color}>
                        <small>{Number(month)}월</small>
                        <strong>{Number(day)}</strong>
                      </DateBox>
                      <ListText>
                        <p>{event.title}</p>
                        <small>
                          {event.date === today ? "오늘" : formatMonthDay(event.date)} ·{" "}
                          {event.allDay ? "종일" : `${event.startTime} ~ ${event.endTime}`}
                        </small>
                      </ListText>
                    </ListLink>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Megaphone />
              공지사항
            </CardTitle>
            <SectionLink href="/dashboard/notices" />
          </CardHeader>
          <List>
            {notices.map((notice) => (
              <ListItem key={notice.id}>
                <ListLink href={`/dashboard/notices/${notice.id}`}>
                  {notice.pinned ? (
                    <Pin size={14} color="currentColor" style={{ flexShrink: 0, opacity: 0.6 }} />
                  ) : (
                    <StatusBadge value={NOTICE_CATEGORIES[notice.category]} />
                  )}
                  <ListText>
                    <p>{notice.title}</p>
                  </ListText>
                  <Meta>{formatDate(notice.createdAt)}</Meta>
                </ListLink>
              </ListItem>
            ))}
          </List>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <KanbanSquare />내 업무
            </CardTitle>
            <SectionLink href="/dashboard/tasks" />
          </CardHeader>
          {myTasks.length === 0 ? (
            <EmptyState title="할당된 업무가 없습니다" />
          ) : (
            <List>
              {myTasks.slice(0, 5).map((task) => (
                <ListItem key={task.id}>
                  <ListLink href="/dashboard/tasks">
                    <StatusBadge value={TASK_PRIORITY[task.priority]} />
                    <ListText>
                      <p>{task.title}</p>
                      <small>
                        {TASK_STATUS[task.status].label} · 마감 {formatMonthDay(task.dueDate)}
                      </small>
                    </ListText>
                    {task.dueDate < today && <Badge $tone="danger">지연</Badge>}
                  </ListLink>
                </ListItem>
              ))}
            </List>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <MessagesSquare />
              게시판 최신글
            </CardTitle>
            <SectionLink href="/dashboard/board" />
          </CardHeader>
          <List>
            {posts.map((post) => (
              <ListItem key={post.id}>
                <ListLink href={`/dashboard/board/${post.id}`}>
                  <ListText>
                    <p>
                      {post.title}
                      {post.comments.length > 0 && ` [${post.comments.length}]`}
                    </p>
                    <small>
                      {getMemberName(data, post.authorId)} · {formatRelative(post.createdAt)}
                    </small>
                  </ListText>
                </ListLink>
              </ListItem>
            ))}
          </List>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <DoorOpen />
              오늘 회의실 예약
            </CardTitle>
            <SectionLink href="/dashboard/reservations" />
          </CardHeader>
          {todayReservations.length === 0 ? (
            <EmptyState title="오늘 예약된 회의실이 없습니다" />
          ) : (
            <List>
              {todayReservations.map((r) => (
                <ListItem key={r.id}>
                  <ListLink href="/dashboard/reservations">
                    <ListText>
                      <p>{r.title}</p>
                      <small>
                        {getRoomName(data, r)} ·{" "}
                        {getMemberName(data, r.memberId)}
                      </small>
                    </ListText>
                    <Meta>
                      {r.startTime} ~ {r.endTime}
                    </Meta>
                  </ListLink>
                </ListItem>
              ))}
            </List>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Users />
              구성원 현황
            </CardTitle>
            <SectionLink href="/dashboard/members" />
          </CardHeader>
          <StatusGrid>
            {statusCounts.map(({ status, count }) => (
              <div key={status}>
                <StatusBadge value={MEMBER_STATUS[status]} />
                <strong>{count}</strong>
              </div>
            ))}
          </StatusGrid>
          {onLeave.length > 0 && (
            <AvatarStack>
              <small style={{ width: "100%", fontSize: 12, opacity: 0.7 }}>휴가중</small>
              {onLeave.map((m) => (
                <span key={m.id} title={m.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Avatar name={m.name} color={m.color} size={26} />
                  <span style={{ fontSize: 13 }}>{m.name}</span>
                </span>
              ))}
            </AvatarStack>
          )}
          <small style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, fontSize: 12, opacity: 0.7 }}>
            <Dot $color="currentColor" />
            전체 {data.members.length}명
          </small>
        </Card>
      </Grid>
    </>
  );
}
