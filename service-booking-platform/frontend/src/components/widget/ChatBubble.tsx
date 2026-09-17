import React from "react";
import { MessageSquare, X } from "lucide-react";

interface ChatBubbleProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
  businessName?: string;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  isOpen,
  onToggle,
  unreadCount = 0,
  businessName,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {!isOpen && businessName && (
        <div
          onClick={onToggle}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#121622]/90 backdrop-blur-md border border-white/10 text-white text-xs font-medium shadow-xl cursor-pointer hover:border-indigo-500/40 transition-all animate-fade-in"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Chat with {businessName}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "Close chat widget" : "Open chat widget"}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer relative ${
          isOpen
            ? "bg-slate-800 hover:bg-slate-700 border border-white/10"
            : "bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-500/30"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-200 rotate-90 animate-fade-in" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-transform duration-200 animate-fade-in" />
        )}

        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
