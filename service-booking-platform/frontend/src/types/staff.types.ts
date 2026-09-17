import type { BookingStatus } from "./booking.types";

export interface StaffQueueItem {
  booking_id: string;
  service_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  note: string | null;
  status: BookingStatus;
  created_at: string;
  assigned_staff_id: string | null;
}

export interface QueueCounts {
  total: number;
  pending: number;
  accepted: number;
  unassigned: number;
}

export interface StaffLoginResponse {
  access_token: string;
  staff_name: string;
}
