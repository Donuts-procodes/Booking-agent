import React, { useState } from "react";
import { bookingApi } from "../../services/bookingApi";
import type { StatusCheckResponse } from "../../types/booking.types";
import { X, Search, AlertCircle, CheckCircle2, Clock, Ban } from "lucide-react";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatusModal: React.FC<StatusModalProps> = ({ isOpen, onClose }) => {
  const [bookingId, setBookingId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cancellation flow state
  const [cancelling, setCancelling] = useState(false);
  const [cancelToken, setCancelToken] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim() || !phone.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCancelToken(null);
    setCancelSuccess(false);

    try {
      const res = await bookingApi.checkStatus({
        booking_id: bookingId.trim(),
        phone: phone.trim(),
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Booking not found with the provided details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateCancel = async () => {
    if (!bookingId || !phone) return;
    setCancelling(true);
    setError(null);
    try {
      const res = await bookingApi.verifyCancellation({
        booking_id: bookingId.trim(),
        phone_or_name: phone.trim(),
      });
      setCancelToken(res.data.verification_token || res.data.cancellation_token || null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Cancellation verification failed.");
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelToken || !bookingId) return;
    setCancelling(true);
    setError(null);
    try {
      await bookingApi.executeCancellation(bookingId.trim(), cancelToken, cancellationReason || undefined);
      setCancelSuccess(true);
      setResult(null);
      setCancelToken(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to cancel booking.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted & Assigned
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> In Staff Queue
          </span>
        );
      case "finalized":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 relative border border-white/10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-400" />
          Check Booking Status
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Enter your Booking Reference ID (e.g. #BK7042) and phone number to check current status.
        </p>

        <form onSubmit={handleLookup} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Booking ID</label>
            <input
              type="text"
              placeholder="#BK1234"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Registered Phone Number</label>
            <input
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? "Searching..." : "Lookup Status"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {cancelSuccess && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>Booking #{bookingId} has been successfully cancelled.</span>
          </div>
        )}

        {result && (
          <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">ID: {result.booking_id}</span>
              {getStatusBadge(result.status)}
            </div>

            <div className="text-sm">
              <span className="text-slate-400 text-xs block">Service</span>
              <span className="text-white font-medium">{result.service_name}</span>
            </div>

            {result.assigned_staff_name && (
              <div className="text-sm">
                <span className="text-slate-400 text-xs block">Assigned Specialist</span>
                <span className="text-indigo-300 font-medium">{result.assigned_staff_name}</span>
              </div>
            )}

            {/* Cancellation trigger */}
            {result.status !== "cancelled" && result.status !== "finalized" && !cancelToken && (
              <div className="pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleInitiateCancel}
                  disabled={cancelling}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Request Booking Cancellation
                </button>
              </div>
            )}

            {/* Confirm cancellation block */}
            {cancelToken && (
              <div className="pt-3 border-t border-white/10 space-y-2 animate-fade-in">
                <label className="block text-xs font-medium text-slate-300">
                  Reason for cancellation (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Schedule conflict"
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  {cancelling ? "Processing..." : "Confirm Cancellation"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
