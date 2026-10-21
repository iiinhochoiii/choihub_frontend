import { addDays, isWeekend, minutesToTime, toDateKey } from "./date";
import type {
  ApprovalDocument,
  ApprovalForm,
  AttendanceRecord,
  CalendarEvent,
  GroupwareData,
  LeaveRequest,
  Member,
  Notice,
  Post,
  Reservation,
  Task,
} from "./types";

export const DATA_VERSION = 1;

export const DEMO_ACCOUNTS = [
  { role: "manager", buttonLabel: "매니저로 로그인", description: "매니저 · 경영지원본부", email: "admin@testcompany.example", password: "password" },
  { role: "employee", buttonLabel: "직원으로 로그인", description: "방문자 · 프론트엔드팀", email: "user@testcompany.example", password: "password" },
] as const;

/** 매 실행 같은 값을 내는 의사난수 (시드 데이터를 안정적으로 만들기 위함) */
function createRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const members: Member[] = [
  { id: "m1", name: "매니저", email: "admin@testcompany.example", password: "password", role: "manager", departmentId: "d1", position: "대표이사", phone: "010-1000-0001", extension: "100", joinedAt: "2018-03-12", birthday: "04-17", status: "active", annualLeaveTotal: 20, color: "#3b5bdb" },
  { id: "m2", name: "이서연", email: "seoyeon.lee@testcompany.example", password: "password", role: "manager", departmentId: "d2", position: "팀장", phone: "010-1000-0002", extension: "201", joinedAt: "2019-01-07", birthday: "11-02", status: "active", annualLeaveTotal: 18, color: "#d6336c" },
  { id: "m3", name: "최유진", email: "yujin.choi@testcompany.example", password: "password", role: "employee", departmentId: "d2", position: "매니저", phone: "010-1000-0003", extension: "202", joinedAt: "2022-05-02", birthday: "10-25", status: "active", annualLeaveTotal: 15, color: "#ae3ec9" },
  { id: "m4", name: "윤하은", email: "haeun.yoon@testcompany.example", password: "password", role: "employee", departmentId: "d3", position: "대리", phone: "010-1000-0004", extension: "301", joinedAt: "2021-08-16", birthday: "02-14", status: "remote", annualLeaveTotal: 16, color: "#f76707" },
  { id: "m5", name: "방문자", email: "user@testcompany.example", password: "password", role: "employee", departmentId: "d5", position: "선임", phone: "010-1000-0005", extension: "411", joinedAt: "2022-02-21", birthday: "07-09", status: "active", annualLeaveTotal: 15, color: "#0ca678" },
  { id: "m6", name: "강태현", email: "taehyun.kang@testcompany.example", password: "password", role: "manager", departmentId: "d4", position: "본부장", phone: "010-1000-0006", extension: "400", joinedAt: "2018-06-01", birthday: "09-30", status: "active", annualLeaveTotal: 20, color: "#1c7ed6" },
  { id: "m7", name: "오지민", email: "jimin.oh@testcompany.example", password: "password", role: "employee", departmentId: "d5", position: "책임", phone: "010-1000-0007", extension: "410", joinedAt: "2020-03-09", birthday: "12-01", status: "active", annualLeaveTotal: 17, color: "#e64980" },
  { id: "m8", name: "서준호", email: "junho.seo@testcompany.example", password: "password", role: "employee", departmentId: "d6", position: "팀장", phone: "010-1000-0008", extension: "420", joinedAt: "2019-09-02", birthday: "05-21", status: "away", annualLeaveTotal: 18, color: "#5f3dc4" },
  { id: "m9", name: "임소율", email: "soyul.lim@testcompany.example", password: "password", role: "employee", departmentId: "d6", position: "선임", phone: "010-1000-0009", extension: "421", joinedAt: "2023-01-02", birthday: "03-03", status: "active", annualLeaveTotal: 15, color: "#2b8a3e" },
  { id: "m10", name: "장현우", email: "hyunwoo.jang@testcompany.example", password: "password", role: "employee", departmentId: "d8", position: "팀장", phone: "010-1000-0010", extension: "510", joinedAt: "2019-04-15", birthday: "08-08", status: "away", annualLeaveTotal: 18, color: "#e8590c" },
  { id: "m11", name: "송예린", email: "yerin.song@testcompany.example", password: "password", role: "employee", departmentId: "d8", position: "사원", phone: "010-1000-0011", extension: "511", joinedAt: "2025-07-01", birthday: "01-19", status: "active", annualLeaveTotal: 11, color: "#c2255c" },
  { id: "m12", name: "배수아", email: "sua.bae@testcompany.example", password: "password", role: "employee", departmentId: "d9", position: "팀장", phone: "010-1000-0012", extension: "520", joinedAt: "2020-10-05", birthday: "06-12", status: "leave", annualLeaveTotal: 17, color: "#099268" },
  { id: "m13", name: "조은비", email: "eunbi.jo@testcompany.example", password: "password", role: "employee", departmentId: "d10", position: "선임", phone: "010-1000-0013", extension: "610", joinedAt: "2021-11-22", birthday: "10-21", status: "active", annualLeaveTotal: 16, color: "#f59f00" },
  { id: "m14", name: "문지호", email: "jiho.moon@testcompany.example", password: "password", role: "employee", departmentId: "d5", position: "사원", phone: "010-1000-0014", extension: "412", joinedAt: "2025-01-06", birthday: "12-24", status: "remote", annualLeaveTotal: 12, color: "#4263eb" },
];

const approvalForms: ApprovalForm[] = [
  {
    id: "f1",
    name: "지출결의서",
    category: "재무",
    description: "업무 관련 비용 지출 후 정산을 요청합니다.",
    fields: [
      { id: "f1_1", label: "지출일자", type: "date", required: true },
      { id: "f1_2", label: "지출금액(원)", type: "number", required: true, placeholder: "숫자만 입력" },
      { id: "f1_3", label: "결제수단", type: "text", required: true, placeholder: "법인카드 / 개인카드 / 현금" },
      { id: "f1_4", label: "지출내역", type: "textarea", required: true, placeholder: "사용처와 목적을 입력하세요" },
    ],
    approverIds: ["m6", "m1"],
    active: true,
    updatedAt: "2026-03-02T09:00:00.000Z",
  },
  {
    id: "f2",
    name: "업무 품의서",
    category: "일반",
    description: "업무 진행에 대한 사전 승인을 요청합니다.",
    fields: [
      { id: "f2_1", label: "시행 예정일", type: "date", required: true },
      { id: "f2_2", label: "예상 비용(원)", type: "number", required: false },
      { id: "f2_3", label: "품의 내용", type: "textarea", required: true },
    ],
    approverIds: ["m6", "m1"],
    active: true,
    updatedAt: "2026-03-02T09:00:00.000Z",
  },
  {
    id: "f3",
    name: "출장 신청서",
    category: "인사",
    description: "국내외 출장 일정과 경비를 신청합니다.",
    fields: [
      { id: "f3_1", label: "출장지", type: "text", required: true },
      { id: "f3_2", label: "출장 시작일", type: "date", required: true },
      { id: "f3_3", label: "출장 종료일", type: "date", required: true },
      { id: "f3_4", label: "예상 경비(원)", type: "number", required: false },
      { id: "f3_5", label: "출장 목적", type: "textarea", required: true },
    ],
    approverIds: ["m6", "m2"],
    active: true,
    updatedAt: "2026-04-11T09:00:00.000Z",
  },
  {
    id: "f4",
    name: "비품 구매 요청서",
    category: "총무",
    description: "업무용 비품·장비 구매를 요청합니다.",
    fields: [
      { id: "f4_1", label: "품목", type: "text", required: true },
      { id: "f4_2", label: "수량", type: "number", required: true },
      { id: "f4_3", label: "단가(원)", type: "number", required: true },
      { id: "f4_4", label: "구매 사유", type: "textarea", required: true },
    ],
    approverIds: ["m2"],
    active: true,
    updatedAt: "2026-05-20T09:00:00.000Z",
  },
];

export function createSeedData(now = new Date()): GroupwareData {
  const random = createRandom(42);
  const today = toDateKey(now);
  const day = (offset: number) => toDateKey(addDays(now, offset));
  const iso = (offsetDays: number, hour = 10, minute = 0) => {
    const d = addDays(now, offsetDays);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  // 최근 30일 근태 기록 (주말 제외). 오늘은 일부 인원만 출근 처리하고 데모 계정은 비워 둔다.
  const attendance: AttendanceRecord[] = [];
  for (let offset = -30; offset <= 0; offset += 1) {
    const date = addDays(now, offset);
    if (isWeekend(date)) continue;
    for (const member of members) {
      if (offset === 0 && (member.id === "m1" || member.id === "m5" || member.id === "m12")) continue;
      const checkIn = 8 * 60 + 30 + Math.floor(random() * 45); // 08:30 ~ 09:15
      const checkOut = 18 * 60 + Math.floor(random() * 120) - 10; // 17:50 ~ 19:50
      attendance.push({
        id: `a_${member.id}_${toDateKey(date)}`,
        memberId: member.id,
        date: toDateKey(date),
        checkIn: minutesToTime(checkIn),
        checkOut: offset === 0 ? null : minutesToTime(checkOut),
      });
    }
  }

  const leaveRequests: LeaveRequest[] = [
    { id: "l1", memberId: "m5", type: "annual", startDate: day(-24), endDate: day(-23), days: 2, reason: "개인 사유", status: "approved", createdAt: iso(-30), reviewerId: "m6" },
    { id: "l2", memberId: "m5", type: "half_pm", startDate: day(-9), endDate: day(-9), days: 0.5, reason: "병원 방문", status: "approved", createdAt: iso(-12), reviewerId: "m6" },
    { id: "l3", memberId: "m5", type: "annual", startDate: day(9), endDate: day(9), days: 1, reason: "가족 행사", status: "pending", createdAt: iso(-1) },
    { id: "l4", memberId: "m12", type: "annual", startDate: day(-1), endDate: day(2), days: 4, reason: "가족 여행", status: "approved", createdAt: iso(-14), reviewerId: "m1" },
    { id: "l5", memberId: "m9", type: "half_am", startDate: day(3), endDate: day(3), days: 0.5, reason: "은행 업무", status: "pending", createdAt: iso(0, 9, 20) },
    { id: "l6", memberId: "m11", type: "annual", startDate: day(14), endDate: day(15), days: 2, reason: "개인 휴식", status: "pending", createdAt: iso(-2) },
  ];

  const events: CalendarEvent[] = [
    { id: "e1", title: "주간 개발 회의", date: today, allDay: false, startTime: "10:00", endTime: "11:00", category: "meeting", ownerId: "m6", description: "스프린트 진행 상황 공유", shared: true },
    { id: "e2", title: "디자인 리뷰", date: today, allDay: false, startTime: "15:00", endTime: "16:00", category: "meeting", ownerId: "m13", description: "대시보드 개편 시안 리뷰", shared: true },
    { id: "e3", title: "월간 전체 회의", date: day(2), allDay: false, startTime: "16:00", endTime: "17:30", category: "company", ownerId: "m1", description: "월간 실적 및 하반기 계획 공유", shared: true },
    { id: "e4", title: "고객사 미팅 (판교)", date: day(1), allDay: false, startTime: "14:00", endTime: "16:00", category: "trip", ownerId: "m10", description: "신규 도입 협의", shared: true },
    { id: "e5", title: "치과 예약", date: day(4), allDay: false, startTime: "18:30", endTime: "19:30", category: "personal", ownerId: "m5", description: "", shared: false },
    { id: "e6", title: "창립기념일 (휴무)", date: day(8), allDay: true, startTime: "09:00", endTime: "18:00", category: "company", ownerId: "m1", description: "전 직원 휴무", shared: true },
    { id: "e7", title: "부산 출장", date: day(6), allDay: true, startTime: "09:00", endTime: "18:00", category: "trip", ownerId: "m8", description: "인프라 점검", shared: true },
    { id: "e8", title: "1:1 면담", date: day(-2), allDay: false, startTime: "11:00", endTime: "11:30", category: "meeting", ownerId: "m6", description: "", shared: true },
    { id: "e9", title: "코드 리뷰 데이", date: day(3), allDay: false, startTime: "13:30", endTime: "15:00", category: "meeting", ownerId: "m7", description: "프론트엔드팀 정기 코드 리뷰", shared: true },
    { id: "e10", title: "신규 입사자 OT", date: day(-6), allDay: false, startTime: "10:00", endTime: "12:00", category: "company", ownerId: "m2", description: "", shared: true },
  ];

  const notices: Notice[] = [
    { id: "n1", title: "[필독] 하반기 보안 교육 이수 안내", category: "system", pinned: true, authorId: "m1", createdAt: iso(-3, 9), updatedAt: iso(-3, 9), views: 128,
      content: "전 직원은 이번 달 말까지 온라인 보안 교육을 이수해야 합니다.\n\n- 교육 시간: 약 40분\n- 이수 방법: 사내 교육 포털 접속 후 '2026 하반기 정보보안' 과정 수강\n- 미이수 시 다음 달 시스템 접근이 제한될 수 있습니다.\n\n문의: 인사팀 이서연 (내선 201)" },
    { id: "n2", title: "창립기념일 휴무 안내", category: "event", pinned: true, authorId: "m2", createdAt: iso(-5, 14), updatedAt: iso(-5, 14), views: 96,
      content: "창립기념일을 맞아 전 직원 휴무를 실시합니다.\n휴무일은 일정관리 캘린더에서 확인할 수 있습니다.\n\n긴급 대응이 필요한 부서는 별도 당직 일정을 공유해 주세요." },
    { id: "n3", title: "연말정산 사전 준비 서류 안내", category: "hr", pinned: false, authorId: "m2", createdAt: iso(-8, 10), updatedAt: iso(-8, 10), views: 74,
      content: "연말정산 일정에 앞서 아래 서류를 미리 준비해 주세요.\n\n1. 부양가족 관계 증빙 서류\n2. 의료비·교육비 영수증 (간소화 서비스 미제공분)\n3. 월세 계약서 사본 (해당자)\n\n세부 일정은 별도 공지 예정입니다." },
    { id: "n4", title: "사내 와이파이 점검 안내 (금요일 19시~21시)", category: "system", pinned: false, authorId: "m6", createdAt: iso(-10, 16), updatedAt: iso(-10, 16), views: 52,
      content: "네트워크 장비 교체 작업으로 해당 시간 동안 사내 와이파이 연결이 불안정할 수 있습니다.\n유선 연결을 권장합니다." },
    { id: "n5", title: "10월 생일자 축하 파티", category: "event", pinned: false, authorId: "m3", createdAt: iso(-12, 11), updatedAt: iso(-12, 11), views: 63,
      content: "이번 달 생일을 맞은 동료들을 위한 작은 파티를 준비했습니다.\n장소: 8층 라운지 / 시간: 금요일 16시\n많은 참여 부탁드립니다!" },
    { id: "n6", title: "재택근무 운영 지침 개정", category: "hr", pinned: false, authorId: "m1", createdAt: iso(-20, 9), updatedAt: iso(-20, 9), views: 141,
      content: "재택근무 운영 지침이 개정되었습니다.\n\n- 주 2회까지 재택근무 가능 (팀장 사전 승인)\n- 재택 시 근태관리 메뉴에서 출퇴근 기록 필수\n- 코어타임(10~16시) 메신저 응답 유지" },
  ];

  const posts: Post[] = [
    { id: "p1", title: "점심 맛집 공유합니다 (회사 근처)", category: "info", authorId: "m7", createdAt: iso(-1, 12, 40), updatedAt: iso(-1, 12, 40), views: 45, likes: ["m5", "m9", "m13"],
      content: "회사 뒷골목에 새로 생긴 국밥집 다녀왔는데 괜찮았어요.\n가격도 합리적이고 대기도 짧습니다. 추천드려요!",
      comments: [
        { id: "c1", authorId: "m5", content: "오 내일 가봐야겠네요", createdAt: iso(-1, 13, 5) },
        { id: "c2", authorId: "m9", content: "저도 다녀왔는데 진짜 맛있어요 👍", createdAt: iso(-1, 14, 20) },
      ] },
    { id: "p2", title: "사내 러닝 동호회 회원 모집", category: "club", authorId: "m10", createdAt: iso(-3, 18), updatedAt: iso(-3, 18), views: 38, likes: ["m11"],
      content: "매주 수요일 퇴근 후 한강에서 5km 가볍게 달립니다.\n초보 환영합니다. 댓글 남겨주세요!",
      comments: [{ id: "c3", authorId: "m11", content: "참여하고 싶습니다!", createdAt: iso(-3, 19) }] },
    { id: "p3", title: "모니터 암 추천 부탁드려요", category: "question", authorId: "m14", createdAt: iso(-4, 15), updatedAt: iso(-4, 15), views: 27, likes: [],
      content: "듀얼 모니터용 모니터 암 쓰시는 분들 추천 부탁드립니다.\n책상 두께는 3cm 정도예요.",
      comments: [{ id: "c4", authorId: "m8", content: "저는 가스 스프링 방식 쓰는데 만족합니다. 비품 구매 요청서로 신청 가능해요.", createdAt: iso(-4, 16) }] },
    { id: "p4", title: "TypeScript 스터디 같이 하실 분", category: "club", authorId: "m5", createdAt: iso(-6, 10), updatedAt: iso(-6, 10), views: 33, likes: ["m7", "m14"],
      content: "주 1회 점심시간에 타입 시스템 심화 스터디를 하려고 합니다.\n관심 있으신 분 댓글 주세요.",
      comments: [] },
    { id: "p5", title: "주차 등록 방법 아시는 분?", category: "question", authorId: "m11", createdAt: iso(-9, 9, 30), updatedAt: iso(-9, 9, 30), views: 19, likes: [],
      content: "신규 차량 주차 등록은 어디서 하나요?",
      comments: [{ id: "c5", authorId: "m3", content: "인사팀에 차량번호 알려주시면 등록해 드립니다!", createdAt: iso(-9, 10) }] },
    { id: "p6", title: "다들 주말 잘 보내셨나요", category: "free", authorId: "m13", createdAt: iso(-11, 9), updatedAt: iso(-11, 9), views: 22, likes: ["m2"],
      content: "날씨가 좋아서 산책 다녀왔어요. 이번 주도 화이팅입니다 :)",
      comments: [] },
  ];

  const approvalDocs: ApprovalDocument[] = [
    {
      id: "doc1", docNumber: "GW-2026-0001", formId: "f1", formName: "지출결의서", title: "고객사 미팅 식대 정산",
      fields: approvalForms[0].fields,
      values: { f1_1: day(-4), f1_2: "86000", f1_3: "법인카드", f1_4: "고객사 미팅 후 저녁 식사 (4인)" },
      drafterId: "m5", createdAt: iso(-3, 11), status: "in_progress",
      steps: [
        { approverId: "m6", status: "approved", comment: "확인했습니다.", actedAt: iso(-2, 10) },
        { approverId: "m1", status: "pending" },
      ],
    },
    {
      id: "doc2", docNumber: "GW-2026-0002", formId: "f3", formName: "출장 신청서", title: "부산 데이터센터 점검 출장",
      fields: approvalForms[2].fields,
      values: { f3_1: "부산", f3_2: day(6), f3_3: day(6), f3_4: "250000", f3_5: "서버 장비 정기 점검 및 교체" },
      drafterId: "m8", createdAt: iso(-1, 15), status: "in_progress",
      steps: [
        { approverId: "m6", status: "pending" },
        { approverId: "m2", status: "waiting" },
      ],
    },
    {
      id: "doc3", docNumber: "GW-2026-0003", formId: "f4", formName: "비품 구매 요청서", title: "개발팀 모니터 암 구매",
      fields: approvalForms[3].fields,
      values: { f4_1: "듀얼 모니터 암", f4_2: "3", f4_3: "89000", f4_4: "신규 입사자 및 장비 교체" },
      drafterId: "m7", createdAt: iso(-7, 10), status: "approved",
      steps: [{ approverId: "m2", status: "approved", comment: "구매 진행하겠습니다.", actedAt: iso(-6, 14) }],
    },
    {
      id: "doc4", docNumber: "GW-2026-0004", formId: "f2", formName: "업무 품의서", title: "협업 툴 유료 플랜 도입",
      fields: approvalForms[1].fields,
      values: { f2_1: day(10), f2_2: "1200000", f2_3: "디자인 협업 툴 팀 플랜 연간 구독" },
      drafterId: "m13", createdAt: iso(-10, 9), status: "rejected",
      steps: [
        { approverId: "m6", status: "approved", actedAt: iso(-9, 11) },
        { approverId: "m1", status: "rejected", comment: "기존 툴과 기능 비교 자료를 보완해 다시 올려주세요.", actedAt: iso(-8, 17) },
      ],
    },
    {
      id: "doc5", docNumber: "GW-2026-0005", formId: "f4", formName: "비품 구매 요청서", title: "기계식 키보드 구매",
      fields: approvalForms[3].fields,
      values: { f4_1: "기계식 키보드", f4_2: "1", f4_3: "129000", f4_4: "기존 키보드 고장" },
      drafterId: "m5", createdAt: iso(0, 9, 40), status: "in_progress",
      steps: [{ approverId: "m2", status: "pending" }],
    },
  ];

  const tasks: Task[] = [
    { id: "t1", title: "대시보드 위젯 API 연동", description: "요약 카드 데이터 API 연결", status: "in_progress", priority: "high", assigneeId: "m5", createdBy: "m7", dueDate: day(2), createdAt: iso(-5) },
    { id: "t2", title: "로그인 화면 접근성 점검", description: "키보드 탐색 및 스크린리더 라벨 확인", status: "todo", priority: "medium", assigneeId: "m5", createdBy: "m7", dueDate: day(5), createdAt: iso(-3) },
    { id: "t3", title: "결재 알림 메일 템플릿", description: "", status: "review", priority: "medium", assigneeId: "m9", createdBy: "m8", dueDate: day(1), createdAt: iso(-6) },
    { id: "t4", title: "근태 통계 쿼리 최적화", description: "월별 집계 인덱스 추가", status: "todo", priority: "high", assigneeId: "m8", createdBy: "m6", dueDate: day(4), createdAt: iso(-2) },
    { id: "t5", title: "신규 입사자 계정 발급", description: "", status: "done", priority: "low", assigneeId: "m3", createdBy: "m2", dueDate: day(-3), createdAt: iso(-8) },
    { id: "t6", title: "하반기 마케팅 캠페인 기획안", description: "", status: "in_progress", priority: "high", assigneeId: "m12", createdBy: "m1", dueDate: day(7), createdAt: iso(-9) },
    { id: "t7", title: "디자인 시스템 컬러 토큰 정리", description: "다크모드 대응 포함", status: "review", priority: "medium", assigneeId: "m13", createdBy: "m13", dueDate: day(3), createdAt: iso(-4) },
    { id: "t8", title: "고객사 제안서 작성", description: "", status: "todo", priority: "medium", assigneeId: "m10", createdBy: "m10", dueDate: day(6), createdAt: iso(-1) },
    { id: "t9", title: "캘린더 컴포넌트 리팩터링", description: "", status: "done", priority: "low", assigneeId: "m5", createdBy: "m5", dueDate: day(-1), createdAt: iso(-10) },
    { id: "t10", title: "분기 재무 보고서 초안", description: "", status: "in_progress", priority: "medium", assigneeId: "m4", createdBy: "m1", dueDate: day(8), createdAt: iso(-4) },
  ];

  const reservations: Reservation[] = [
    { id: "r1", roomId: "room1", date: today, startTime: "10:00", endTime: "11:00", title: "주간 개발 회의", memberId: "m6" },
    { id: "r2", roomId: "room2", date: today, startTime: "15:00", endTime: "16:00", title: "디자인 리뷰", memberId: "m13" },
    { id: "r3", roomId: "room3", date: today, startTime: "13:00", endTime: "14:00", title: "채용 면접", memberId: "m2" },
    { id: "r4", roomId: "room1", date: day(2), startTime: "16:00", endTime: "17:30", title: "월간 전체 회의", memberId: "m1" },
    { id: "r5", roomId: "room2", date: day(1), startTime: "11:00", endTime: "12:00", title: "백엔드 설계 논의", memberId: "m8" },
  ];

  return {
    version: DATA_VERSION,
    company: {
      name: "테스트컴퍼니",
      nameEn: "Test Company Inc.",
      ceo: "매니저",
      businessNumber: "123-45-67890",
      corporateNumber: "110111-1234567",
      industry: "소프트웨어 개발 및 공급",
      foundedAt: "2018-03-12",
      phone: "02-1234-5678",
      fax: "02-1234-5679",
      email: "contact@testcompany.example",
      website: "https://www.testcompany.example",
      address: "서울특별시 강남구 테헤란로 123, 8층",
      workStart: "09:00",
      workEnd: "18:00",
      defaultAnnualLeave: 15,
    },
    departments: [
      { id: "d1", name: "경영지원본부", parentId: null },
      { id: "d2", name: "인사팀", parentId: "d1" },
      { id: "d3", name: "재무팀", parentId: "d1" },
      { id: "d4", name: "개발본부", parentId: null },
      { id: "d5", name: "프론트엔드팀", parentId: "d4" },
      { id: "d6", name: "백엔드팀", parentId: "d4" },
      { id: "d7", name: "사업본부", parentId: null },
      { id: "d8", name: "영업팀", parentId: "d7" },
      { id: "d9", name: "마케팅팀", parentId: "d7" },
      { id: "d10", name: "디자인팀", parentId: null },
    ],
    members,
    attendance,
    leaveRequests,
    events,
    notices,
    posts,
    approvalForms,
    approvalDocs,
    tasks,
    rooms: [
      { id: "room1", name: "대회의실", capacity: 12, location: "8층", equipment: ["빔프로젝터", "화상회의"], active: true },
      { id: "room2", name: "소회의실 A", capacity: 6, location: "8층", equipment: ["TV", "화이트보드"], active: true },
      { id: "room3", name: "소회의실 B", capacity: 4, location: "7층", equipment: ["화이트보드"], active: true },
      { id: "room4", name: "포커스룸", capacity: 2, location: "7층", equipment: ["모니터"], active: true },
    ],
    reservations,
    archiveFolders: ["전사 공용", "인사/총무", "개발", "디자인", "영업/마케팅"],
    archiveFiles: [
      { id: "file1", name: "2026_취업규칙.pdf", folder: "인사/총무", size: 1_284_000, mimeType: "application/pdf", uploaderId: "m2", uploadedAt: iso(-40), description: "개정 취업규칙 전문" },
      { id: "file2", name: "회사소개서_v3.pptx", folder: "전사 공용", size: 8_420_000, mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", uploaderId: "m12", uploadedAt: iso(-15), description: "대외용 회사소개서" },
      { id: "file3", name: "CI_가이드.zip", folder: "디자인", size: 24_600_000, mimeType: "application/zip", uploaderId: "m13", uploadedAt: iso(-60), description: "로고 및 컬러 가이드" },
      { id: "file4", name: "API_명세서.xlsx", folder: "개발", size: 312_000, mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", uploaderId: "m8", uploadedAt: iso(-5), description: "" },
      { id: "file5", name: "법인카드_사용지침.pdf", folder: "인사/총무", size: 540_000, mimeType: "application/pdf", uploaderId: "m4", uploadedAt: iso(-25), description: "" },
      { id: "file6", name: "영업_제안서_템플릿.docx", folder: "영업/마케팅", size: 1_020_000, mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", uploaderId: "m10", uploadedAt: iso(-12), description: "고객사 제안서 기본 템플릿" },
      { id: "file7", name: "온보딩_체크리스트.pdf", folder: "전사 공용", size: 220_000, mimeType: "application/pdf", uploaderId: "m3", uploadedAt: iso(-8), description: "신규 입사자 첫 주 체크리스트" },
    ],
  };
}
