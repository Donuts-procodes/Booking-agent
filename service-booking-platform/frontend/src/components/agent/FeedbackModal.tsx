import React, { useState } from "react";
import { Star, MessageSquareCheck, X } from "lucide-react";
import apiClient from "../../services/apiClient";
import { useMerchant } from "../../context/MerchantContext";

interface FeedbackModalProps {
  isOpen: boolean;
  bookingId?: string | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  bookingId,
  onClose,
  onSubmitSuccess,
}) => {
  const { merchantId } = useMerchant();
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/feedback", {
        merchant_id: merchantId,
        booking_id: bookingId || undefined,
        rating,
        comment: comment.trim() || undefined,
        interaction_type: "booking_flow",
      });
      onSubmitSuccess();
    } catch {
      onSubmitSuccess();
    } finally {
      setLoading(false);
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

        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 fill-amber-400/20" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">How was your booking experience?</h3>
          <p className="text-xs text-slate-400 mt-1">
            Your feedback helps our AI concierge and staff provide exceptional service.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const active = (hoveredRating !== null ? hoveredRating : rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      active
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Comments or Suggestions (optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what you loved or how we can improve..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <MessageSquareCheck className="w-4 h-4" />
            {loading ? "Submitting..." : "Send Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};
