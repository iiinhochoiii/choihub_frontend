export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  /** false면 사용 중지(공사·점검 등). 새 예약을 받지 않는다. */
  active: boolean;
  inactiveReason?: string;
}

export interface Reservation {
  id: string;
  /** 회의실이 삭제되면 null. 이때 roomName으로 표시한다. */
  roomId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  memberId: string;
  roomName?: string;
}

export interface RoomRequest {
  name: string;
  capacity: number;
  location: string;
  equipment?: string[];
}

export type UpdateRoomRequest = Partial<RoomRequest>;

export interface DeactivateRoomRequest {
  reason?: string;
}

export interface ReorderRoomsRequest {
  roomIds: string[];
}

export interface CreateReservationRequest {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}
