import React, { useState } from "react";
import type { StaffQueueItem } from "../../types/staff.types";
import { User, Phone, Mail, FileText, Check, X, CheckCircle, Clock } from "lucide-react";

interface QueueCardProps {
  item: StaffQueueItem;
  onAccept: (bookingId: string) => Promise<void>;
  onReject: (bookingId: string, reason: string) => Promise<void>;
  onOpenFinalize: (bookingId: string) => void;
}

export const QueueCard: React.FC<QueueCardProps> = ({
  item,
  onAccept,
  onReject,
  onOpenFinalize,
}) => {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await onReject(item.booking_id, reason.trim());
      setRejecting(false);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date(item.created_at).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all shadow-lg">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
              {item.booking_id}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                item.status === "accepted"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}
            >
              {item.status.toUpperCase()}
            </span>
          </div>
          <h4 className="text-base font-bold text-white mt-1.5">{item.service_name}</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="py-4 space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="font-semibold text-white">{item.customer_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
          <a href={`tel:${item.customer_phone}`} className="hover:underline text-slate-200">
            {item.customer_phone}
          </a>
        </div>
        {item.customer_email && (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-400 shrink-0" />
            <a href={`mailto:${item.customer_email}`} className="hover:underline text-slate-200">
              {item.customer_email}
            </a>
          </div>
        )}
        {item.note && (
          <div className="flex items-start gap-2 pt-1">
            <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <span className="italic text-slate-400 bg-white/5 p-2 rounded-lg w-full">
              "{item.note}"
            </span>
          </div>
        )}
      </div>

      {/* Action triggers */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
        {item.status === "pending" && !rejecting && (
          <>
            <button
              type="button"
              onClick={() => onAccept(item.booking_id)}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
            >
              <Check className="w-4 h-4" />
              Accept Assignment
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
          </>
        )}

        {item.status === "accepted" && (
          <button
            type="button"
            onClick={() => onOpenFinalize(item.booking_id)}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Finalize Completed Service
          </button>
        )}
      </div>

      {rejecting && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2 animate-fade-in">
          <label className="block text-xs font-medium text-rose-300">
            Rejection Reason (required for automatic re-routing cascade)
          </label>
          <input
            type="text"
            placeholder="e.g. Schedule conflict, out of office"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-rose-500/30 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-400"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading || !reason.trim()}
              className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? "Re-routing..." : "Confirm & Cascade to Next Staff"}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 text-xs cursor-pointer hover:bg-white/15"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
