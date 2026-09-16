import apiClient from "./apiClient";
import type { BookingResponse, StatusCheckResponse, VerifyCancellationResponse } from "../types/booking.types";

export const bookingApi = {
  createBooking: (data: {
    merchant_id: string;
    service_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    note?: string;
  }) => apiClient.post<BookingResponse>("/bookings", data),

  checkStatus: (data: { booking_id: string; phone: string }) =>
    apiClient.post<StatusCheckResponse>("/bookings/status-check", data),

  verifyCancellation: (data: { booking_id: string; phone_or_name: string }) =>
    apiClient.post<VerifyCancellationResponse>("/bookings/verify", data),

  executeCancellation: (bookingId: string, token: string, reason?: string) =>
    apiClient.post(
      `/bookings/${bookingId}/cancel`,
      { cancellation_reason: reason },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
};
