import React, { useState } from "react";
import { CheckCircle2, DollarSign, FileText, X } from "lucide-react";

interface FinalizeModalProps {
  isOpen: boolean;
  bookingId: string;
  onClose: () => void;
  onConfirm: (notes: string, price?: number) => Promise<void>;
}

export const FinalizeModal: React.FC<FinalizeModalProps> = ({
  isOpen,
  bookingId,
  onClose,
  onConfirm,
}) => {
  const [notes, setNotes] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const parsedPrice = price ? parseFloat(price) : undefined;
      await onConfirm(notes, parsedPrice);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 relative border border-white/10 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Finalize Service Booking
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Record offline service delivery details, customer agreements, and final billing for{" "}
          <span className="text-indigo-300 font-mono">{bookingId}</span>.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Final Agreed Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="e.g. 120.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Offline Notes & Outcome
            </label>
            <textarea
              rows={4}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details about customer consultation, completed service scope, or follow-up recommendations..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Finalizing..." : "Complete & Mark as Finalized"}
          </button>
        </form>
      </div>
    </div>
  );
};
