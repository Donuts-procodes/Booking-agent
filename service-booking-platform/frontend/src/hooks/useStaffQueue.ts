import { useState, useEffect, useCallback } from "react";
import { staffApi } from "../services/staffApi";
import type { StaffQueueItem } from "../types/staff.types";

export function useStaffQueue() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("staff_token"));
  const [staffName, setStaffName] = useState<string | null>(() => localStorage.getItem("staff_name"));
  const [queue, setQueue] = useState<StaffQueueItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.login(email, pass);
      localStorage.setItem("staff_token", res.data.access_token);
      localStorage.setItem("staff_name", res.data.staff_name);
      setToken(res.data.access_token);
      setStaffName(res.data.staff_name);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid login credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("staff_token");
    localStorage.removeItem("staff_name");
    setToken(null);
    setStaffName(null);
    setQueue([]);
  };

  const fetchQueue = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await staffApi.getQueue();
      setQueue(res.data);
      setError(null);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout();
      } else {
        setError(err?.response?.data?.detail || "Failed to load booking queue.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchQueue();
      const timer = setInterval(fetchQueue, 10000);
      return () => clearInterval(timer);
    }
  }, [token, fetchQueue]);

  const respondToBooking = async (bookingId: string, decision: "accept" | "reject", rejectionReason?: string) => {
    try {
      await staffApi.makeDecision(bookingId, decision, rejectionReason);
      await fetchQueue();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to update booking status.");
      throw err;
    }
  };

  const finalizeBooking = async (bookingId: string, offlineNotes: string, _finalPrice?: number) => {
    try {
      await staffApi.finalizeBooking(bookingId, {
        scheduled_date: new Date().toISOString(),
        payment_status: "completed",
        notes: offlineNotes,
      });
      await fetchQueue();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to finalize booking.");
      throw err;
    }
  };

  return {
    token,
    staffName,
    queue,
    loading,
    error,
    login,
    logout,
    fetchQueue,
    respondToBooking,
    finalizeBooking,
  };
}
