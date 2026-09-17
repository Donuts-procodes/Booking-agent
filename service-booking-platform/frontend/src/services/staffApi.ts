import apiClient from "./apiClient";
import type { StaffQueueItem, StaffLoginResponse, QueueCounts } from "../types/staff.types";

export const staffApi = {
  login: (email: string, password: string) =>
    apiClient.post<StaffLoginResponse>("/auth/staff/login", { email, password }),

  getQueue: (statusFilter?: string, search?: string) =>
    apiClient.get<StaffQueueItem[]>("/staff/bookings", {
      params: {
        ...(statusFilter ? { status_filter: statusFilter } : {}),
        ...(search ? { search } : {}),
      },
    }),

  getCounts: () =>
    apiClient.get<QueueCounts>("/staff/bookings/counts"),

  claimBooking: (bookingId: string) =>
    apiClient.post(`/staff/bookings/${bookingId}/claim`),

  makeDecision: (bookingId: string, action: "accept" | "reject", reason?: string) =>
    apiClient.patch(`/staff/bookings/${bookingId}/decision`, { action, reason }),

  finalizeBooking: (
    bookingId: string,
    data: { scheduled_date: string; payment_status: string; notes?: string }
  ) => apiClient.patch(`/staff/bookings/${bookingId}/finalize`, data),
};
