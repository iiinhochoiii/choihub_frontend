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
import { useState, type ReactNode } from "react";
import { getErrorMessage } from "@/apis/defaultInstance";
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
  ErrorState,
  LoadingState,
  StatusBadge,
  transientOptions,
} from "@/components/ui";
import { findLeaveOn } from "@/components/attendance/utils";
import { getCurrentStep, isMyTurn } from "@/lib/approval";
import { getDayStatus, getDayStatusBadge } from "@/lib/attendance";
import { formatDate, formatLongDate, formatMonthDay, formatRelative, toDateKey } from "@/lib/date";
import {
  APPROVAL_DOC_STATUS,
  EVENT_CATEGORIES,
  MEMBER_STATUS,
  NOTICE_CATEGORIES,
  TASK_PRIORITY,
  TASK_STATUS,
} from "@/lib/labels";
import { getRoomName } from "@/lib/selectors";
import { useApprovalDocs } from "@/queries/approval";
import {
  useCheckIn,
  useCheckOut,
  useLeaveBalance,
  useMyLeaveRequests,
  useTodayAttendance,
} from "@/queries/attendance";
import { useCurrentUser } from "@/queries/auth";
import { useCompany, useDirectory } from "@/queries/directory";
import { useEvents } from "@/queries/events";
import { useNotices } from "@/queries/notices";
import { usePosts } from "@/queries/posts";
import { useReservationsByDate, useRooms } from "@/queries/reservations";
import { useTasks } from "@/queries/tasks";
import type { MemberStatus } from "@/types";
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
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primarySoft},
    ${({ theme }) => theme.colors.surface}
  );
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

const ErrorText = styled.small`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.danger};
`;

interface QueryState {
  isPending: boolean;
  error: Error | null;
  refetch: () => unknown;
}

/** 카드 본문: 불러오는 중·실패면 그 상태를, 아니면 내용을 그린다. */
function QueryBody({ query, children }: { query: QueryState; children: () => ReactNode }) {
  if (query.isPending) return <LoadingState />;
  if (query.error)
    return <ErrorState message={getErrorMessage(query.error)} onRetry={() => query.refetch()} />;
  return <>{children()}</>;
}

/** 오늘(서버 기준)부터 볼 다가오는 일정 범위 */
const UPCOMING_DAYS = 60;

export function DashboardHome() {
  const user = useCurrentUser();
  const company = useCompany();
  const { members, getMemberName } = useDirectory();
  const [now] = useState(() => new Date());

  // 오늘은 서버(회사 시간대) 기준. 받기 전에는 브라우저 날짜로 대신한다.
  const todayQuery = useTodayAttendance();
  const today = todayQuery.data?.date ?? toDateKey(now);
  const record = todayQuery.data?.record ?? null;
  const todayLeave = findLeaveOn(useMyLeaveRequests().data ?? [], user.id, today);
  const attendanceStatus = getDayStatus(record, todayLeave?.type, company);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const attendanceBusy = checkInMutation.isPending || checkOutMutation.isPending;
  const attendanceError = checkInMutation.error ?? checkOutMutation.error;

  // 연차 잔액은 서버가 계산한다(승인 대기분 제외한 사용 가능 일수).
  const { data: balance } = useLeaveBalance();

  // 결재: pending 함은 내 결재 차례인 문서, drafted 함은 내가 기안한 문서 (둘 다 최신순)
  const pendingDocsQuery = useApprovalDocs("pending");
  const draftedDocsQuery = useApprovalDocs("drafted");
  const myTurnDocs = (pendingDocsQuery.data ?? []).filter((d) => isMyTurn(d, user.id));
  const myDrafts = draftedDocsQuery.data ?? [];
  const approvalList = [
    ...myTurnDocs,
    ...myDrafts.filter((d) => !myTurnDocs.some((t) => t.id === d.id)),
  ].slice(0, 5);
  const approvalQuery = {
    isPending: pendingDocsQuery.isPending || draftedDocsQuery.isPending,
    error: pendingDocsQuery.error ?? draftedDocsQuery.error,
    refetch: () => {
      void pendingDocsQuery.refetch();
      void draftedDocsQuery.refetch();
    },
  };

  // 일정: 서버가 내 일정 + 공유 일정만 날짜순으로 준다.
  const upcomingTo = toDateKey(new Date(now.getTime() + UPCOMING_DAYS * 24 * 60 * 60 * 1000));
  const eventsQuery = useEvents({ from: today, to: upcomingTo });
  const visibleEvents = [...(eventsQuery.data ?? [])].sort((a, b) =>
    (a.date + (a.allDay ? "" : a.startTime)).localeCompare(b.date + (b.allDay ? "" : b.startTime)),
  );
  const todayEventCount = visibleEvents.filter((e) => e.date === today).length;

  // 내 업무(담당) 중 완료 전. 마감일 빠른 순, 기한 없음은 마지막
  const tasksQuery = useTasks({ scope: "mine" });
  const myTasks = (tasksQuery.data ?? [])
    .filter((t) => t.status !== "done")
    .sort((a, b) => (a.dueDate || "9999-99-99").localeCompare(b.dueDate || "9999-99-99"));

  // 공지·게시글: 첫 페이지(서버 정렬: 공지는 고정 우선 → 최신순, 게시글은 최신순)
  const noticesQuery = useNotices();
  const notices = (noticesQuery.data?.items ?? []).slice(0, 5);
  const postsQuery = usePosts();
  const posts = (postsQuery.data?.items ?? []).slice(0, 5);

  const reservationsQuery = useReservationsByDate(today);
  const { data: rooms = [] } = useRooms();
  const todayReservations = reservationsQuery.data ?? [];

  const statusCounts = (Object.keys(MEMBER_STATUS) as MemberStatus[]).map((status) => ({
    status,
    count: members.filter((m) => m.status === status).length,
  }));
  const onLeave = members.filter((m) => m.status === "leave");

  const checkIn = () => {
    checkOutMutation.reset();
    checkInMutation.mutate();
  };

  const checkOut = () => {
    checkInMutation.reset();
    checkOutMutation.mutate();
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
              {balance ? balance.available : "-"}
              <em>/ {balance ? balance.total : "-"}일</em>
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
              {pendingDocsQuery.data ? myTurnDocs.length : "-"}
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
              {eventsQuery.data ? todayEventCount : "-"}
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
              {tasksQuery.data ? myTasks.length : "-"}
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
            <StatusBadge value={getDayStatusBadge(attendanceStatus, todayLeave?.type)} />
          </CardHeader>
          {todayQuery.isPending ? (
            <LoadingState />
          ) : todayQuery.error ? (
            <ErrorState message={getErrorMessage(todayQuery.error)} onRetry={() => todayQuery.refetch()} />
          ) : (
            <>
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
                <Button $block onClick={checkIn} disabled={attendanceBusy}>
                  <LogIn />
                  출근하기
                </Button>
              ) : !record.checkOut ? (
                <Button $block $variant="secondary" onClick={checkOut} disabled={attendanceBusy}>
                  <LogOut />
                  퇴근하기
                </Button>
              ) : (
                <Button $block $variant="secondary" disabled>
                  오늘 근무를 마쳤습니다
                </Button>
              )}
              {attendanceError && <ErrorText role="alert">{getErrorMessage(attendanceError)}</ErrorText>}
            </>
          )}
          <small style={{ color: "inherit", opacity: 0.6, fontSize: 12 }}>
            근무시간 {company.workStart} ~ {company.workEnd}
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
          <QueryBody query={approvalQuery}>
            {() =>
              approvalList.length === 0 ? (
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
                              {doc.formName} · {getMemberName(doc.drafterId)}
                              {current && ` → ${getMemberName(current.approverId)}`}
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
              )
            }
          </QueryBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <CalendarDays />
              다가오는 일정
            </CardTitle>
            <SectionLink href="/dashboard/schedule" />
          </CardHeader>
          <QueryBody query={eventsQuery}>
            {() =>
              visibleEvents.length === 0 ? (
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
              )
            }
          </QueryBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Megaphone />
              공지사항
            </CardTitle>
            <SectionLink href="/dashboard/notices" />
          </CardHeader>
          <QueryBody query={noticesQuery}>
            {() => (
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
            )}
          </QueryBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <KanbanSquare />내 업무
            </CardTitle>
            <SectionLink href="/dashboard/tasks" />
          </CardHeader>
          <QueryBody query={tasksQuery}>
            {() =>
              myTasks.length === 0 ? (
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
                            {TASK_STATUS[task.status].label} ·{" "}
                            {task.dueDate ? `마감 ${formatMonthDay(task.dueDate)}` : "기한 없음"}
                          </small>
                        </ListText>
                        {!!task.dueDate && task.dueDate < today && <Badge $tone="danger">지연</Badge>}
                      </ListLink>
                    </ListItem>
                  ))}
                </List>
              )
            }
          </QueryBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <MessagesSquare />
              게시판 최신글
            </CardTitle>
            <SectionLink href="/dashboard/board" />
          </CardHeader>
          <QueryBody query={postsQuery}>
            {() => (
              <List>
                {posts.map((post) => (
                  <ListItem key={post.id}>
                    <ListLink href={`/dashboard/board/${post.id}`}>
                      <ListText>
                        <p>
                          {post.title}
                          {post.commentCount > 0 && ` [${post.commentCount}]`}
                        </p>
                        <small>
                          {getMemberName(post.authorId)} · {formatRelative(post.createdAt)}
                        </small>
                      </ListText>
                    </ListLink>
                  </ListItem>
                ))}
              </List>
            )}
          </QueryBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <DoorOpen />
              오늘 회의실 예약
            </CardTitle>
            <SectionLink href="/dashboard/reservations" />
          </CardHeader>
          <QueryBody query={reservationsQuery}>
            {() =>
              todayReservations.length === 0 ? (
                <EmptyState title="오늘 예약된 회의실이 없습니다" />
              ) : (
                <List>
                  {todayReservations.map((r) => (
                    <ListItem key={r.id}>
                      <ListLink href="/dashboard/reservations">
                        <ListText>
                          <p>{r.title}</p>
                          <small>
                            {getRoomName(rooms, r)} · {getMemberName(r.memberId)}
                          </small>
                        </ListText>
                        <Meta>
                          {r.startTime} ~ {r.endTime}
                        </Meta>
                      </ListLink>
                    </ListItem>
                  ))}
                </List>
              )
            }
          </QueryBody>
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
                <span
                  key={m.id}
                  title={m.name}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Avatar name={m.name} color={m.color} size={26} />
                  <span style={{ fontSize: 13 }}>{m.name}</span>
                </span>
              ))}
            </AvatarStack>
          )}
          <small
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 14,
              fontSize: 12,
              opacity: 0.7,
            }}
          >
            <Dot $color="currentColor" />
            전체 {members.length}명
          </small>
        </Card>
      </Grid>
    </>
  );
}
