import type { Department, GroupwareData, Member, Reservation } from "./types";

export function getMember(data: GroupwareData, id: string): Member | undefined {
  return data.members.find((m) => m.id === id);
}

export function getMemberName(data: GroupwareData, id: string): string {
  return getMember(data, id)?.name ?? "알 수 없음";
}

export function getDepartment(data: GroupwareData, id: string): Department | undefined {
  return data.departments.find((d) => d.id === id);
}

export function getDepartmentName(data: GroupwareData, id: string): string {
  return getDepartment(data, id)?.name ?? "-";
}

/** "홍길동 선임 · 프론트엔드팀" 형태 */
export function getMemberSummary(data: GroupwareData, id: string): string {
  const member = getMember(data, id);
  if (!member) return "알 수 없음";
  return `${member.name} ${member.position} · ${getDepartmentName(data, member.departmentId)}`;
}

/** 부서와 그 하위 부서 id 목록 */
export function getDepartmentTreeIds(data: GroupwareData, rootId: string): string[] {
  const children = data.departments.filter((d) => d.parentId === rootId);
  return [rootId, ...children.flatMap((c) => getDepartmentTreeIds(data, c.id))];
}

/** 삭제된 회의실이면 예약에 남겨 둔 이름을 쓴다. */
export function getRoomName(data: GroupwareData, reservation: Reservation): string {
  return data.rooms.find((r) => r.id === reservation.roomId)?.name ?? reservation.roomName ?? "삭제된 회의실";
}
