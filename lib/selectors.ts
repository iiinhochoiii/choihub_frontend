import type { Department, Member, Reservation, Room } from "@/types";

/** 목록에 없는 구성원 id. 삭제된 구성원은 목록에서 빠지므로 남은 기록에는 이 이름을 보여 준다. */
export const UNKNOWN_MEMBER_NAME = "삭제된 구성원";

export function getMember(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}

export function getMemberName(members: Member[], id: string): string {
  return getMember(members, id)?.name ?? UNKNOWN_MEMBER_NAME;
}

export function getDepartment(departments: Department[], id: string): Department | undefined {
  return departments.find((d) => d.id === id);
}

export function getDepartmentName(departments: Department[], id: string): string {
  return getDepartment(departments, id)?.name ?? "-";
}

/** "홍길동 선임 · 프론트엔드팀" 형태 */
export function getMemberSummary(members: Member[], departments: Department[], id: string): string {
  const member = getMember(members, id);
  if (!member) return UNKNOWN_MEMBER_NAME;
  return `${member.name} ${member.position} · ${getDepartmentName(departments, member.departmentId)}`;
}

/** 부서와 그 하위 부서 id 목록 */
export function getDepartmentTreeIds(departments: Department[], rootId: string): string[] {
  const children = departments.filter((d) => d.parentId === rootId);
  return [rootId, ...children.flatMap((c) => getDepartmentTreeIds(departments, c.id))];
}

/** 삭제된 회의실이면 예약에 남겨 둔 이름을 쓴다. */
export function getRoomName(rooms: Room[], reservation: Reservation): string {
  return rooms.find((r) => r.id === reservation.roomId)?.name ?? reservation.roomName ?? "삭제된 회의실";
}
