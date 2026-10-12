export type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "checked_out"
  | "completed"
  | "cancelled";
export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string | number;
  capacity: number;
  equipment: string[];
  latitude?: number;
  longitude?: number;
  map_x?: number;
  map_y?: number;
  location_text: string;
  location_verified: boolean;
  map_url?: string | null;
  active: boolean;
  available?: boolean;
}
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  institutional_id: string;
  role: "borrower" | "admin";
  verified: boolean;
  suspended: boolean;
}
export interface AuthIdentity {
  email: string;
  onboarding_required: boolean;
  profile?: Profile | null;
}
export interface Eligibility {
  eligible: boolean;
  verified: boolean;
  suspended: boolean;
  violation_points: number;
  reason?: string;
}
export interface Reservation {
  id: string;
  user_id: string;
  room_id: string;
  room_name?: string;
  user_name?: string;
  starts_at: string;
  ends_at: string;
  purpose: string;
  attendees: number;
  mode: string;
  status: Status;
  decision_reason?: string;
  key_handed_at?: string;
  key_returned_at?: string;
  created_at: string;
}
export interface Notice {
  id: string;
  title: string;
  body: string;
  read_at?: string;
  created_at: string;
  reservation_id?: string;
}
export interface Violation {
  id: string;
  user_id: string;
  user_name?: string;
  institutional_id?: string;
  reservation_id?: string;
  points: number;
  reason: string;
  resolved: boolean;
  created_at: string;
}
export interface Collection<T> {
  items: T[];
  total?: number;
}
export const statusLabels: Record<Status, string> = {
  pending: "申請中",
  approved: "已核准",
  rejected: "已拒絕",
  checked_out: "已交付鑰匙",
  completed: "已歸還",
  cancelled: "已取消",
};
