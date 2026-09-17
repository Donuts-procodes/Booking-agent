import { useState, useEffect, useCallback } from "react";
import { staffApi } from "../services/staffApi";
import type { StaffQueueItem, QueueCounts } from "../types/staff.types";

export function useStaffQueue() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("staff_token"));
  const [staffName, setStaffName] = useState<string | null>(() => localStorage.getItem("staff_name"));
  const [queue, setQueue] = useState<StaffQueueItem[]>([]);
  const [counts, setCounts] = useState<QueueCounts>({ total: 0, pending: 0, accepted: 0, unassigned: 0 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
    setCounts({ total: 0, pending: 0, accepted: 0, unassigned: 0 });
  };

  const fetchQueue = useCallback(async (search?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const queueRes = await staffApi.getQueue(undefined, search || searchTerm || undefined);
      setQueue(queueRes.data);
      setError(null);

      // Counts endpoint is optional — silently fallback to local computation
      try {
        const countsRes = await staffApi.getCounts();
        setCounts(countsRes.data);
      } catch {
        const items = queueRes.data;
        setCounts({
          total: items.length,
          pending: items.filter((i) => i.status === "pending").length,
          accepted: items.filter((i) => i.status === "accepted").length,
          unassigned: items.filter((i) => !i.assigned_staff_id).length,
        });
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        logout();
      } else {
        setError(err?.response?.data?.detail || "Failed to load booking queue.");
      }
    } finally {
      setLoading(false);
    }
  }, [token, searchTerm]);

  useEffect(() => {
    if (token) {
      fetchQueue();
      const timer = setInterval(() => fetchQueue(), 10000);
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

  const claimBooking = async (bookingId: string) => {
    try {
      await staffApi.claimBooking(bookingId);
      await fetchQueue();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to claim booking.");
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
    counts,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    login,
    logout,
    fetchQueue,
    respondToBooking,
    claimBooking,
    finalizeBooking,
  };
}
