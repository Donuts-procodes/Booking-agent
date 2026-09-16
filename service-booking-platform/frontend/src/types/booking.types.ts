export type BookingStatus = "pending" | "accepted" | "rejected" | "finalized" | "cancelled";

export interface BookingResponse {
  booking_id: string;
  status: BookingStatus;
  assigned_staff_id: string | null;
  created_at: string;
}

export interface StatusCheckResponse {
  booking_id: string;
  status: BookingStatus;
  service_name: string;
  assigned_staff_name?: string | null;
  created_at: string;
}

export interface VerifyCancellationResponse {
  is_valid: boolean;
  cancellation_eligible: boolean;
  reason: string | null;
  message: string | null;
  booking_id: string | null;
  service_name: string | null;
  customer_name: string | null;
  verification_token: string | null;
  cancellation_token?: string | null;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: number;
}
