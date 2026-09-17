import React, { useState, useEffect, useRef } from "react";
import { useChatAgent } from "../../hooks/useChatAgent";
import { useMerchant } from "../../context/MerchantContext";
import { ServiceCard } from "../agent/ServiceCard";
import { StatusModal } from "../agent/StatusModal";
import { FeedbackModal } from "../agent/FeedbackModal";
import { Bot, Send, Sparkles, Search, RefreshCw, X, AlertTriangle } from "lucide-react";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose }) => {
  const { profile } = useMerchant();
  const {
    messages,
    categories,
    services,
    suggestionChips,
    activeServiceCard,
    catalogUnavailable,
    isAwaitingFeedback,
    bookingId,
    phase,
    initChat,
    selectCategory,
    selectService,
    sendMessage,
    submitFeedback,
  } = useChatAgent();

  const [input, setInput] = useState("");
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      initChat();
    }
  }, [isOpen, initChat]);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, services]);

  useEffect(() => {
    if (isAwaitingFeedback) {
      setIsFeedbackModalOpen(true);
    }
  }, [isAwaitingFeedback]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    sendMessage(msg);
  };

  const handleChipClick = (chip: string) => {
    sendMessage(chip);
  };

  if (!isOpen) return null;

  const agentTitle = profile?.name || "AI Service Assistant";

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] h-[600px] max-h-[calc(100vh-7rem)] flex flex-col bg-[#0c0f1d] border border-white/10 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl animate-fade-in">
      {/* Header bar */}
      <div className="px-4 py-3.5 bg-[#121629]/90 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight truncate max-w-[180px]">
                {agentTitle}
              </h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400">AI Booking Concierge</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            title="Track Booking"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Restart conversation"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Minimize chat"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Catalog Warning */}
      {catalogUnavailable && (
        <div className="m-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>Catalog not initialized. Please configure categories &amp; services.</div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pr-2">
        {messages.map((m) => {
          const isAgent = m.sender === "agent";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isAgent ? "" : "flex-row-reverse"}`}
            >
              {isAgent ? (
                <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                  You
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isAgent
                    ? "bg-[#161a2e] border border-white/5 text-slate-100 rounded-tl-sm"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-md"
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
              </div>
            </div>
          );
        })}

        {/* Suggestion Chips */}
        {suggestionChips.length > 0 &&
          (phase === "greeting" || phase === "browse_categories" || phase === "browse_services") && (
            <div className="pl-8 flex flex-wrap gap-1.5 my-2">
              {suggestionChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/25 text-indigo-300 hover:text-white text-[11px] font-medium transition-all cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

        {/* Dynamic Services Cards */}
        {phase === "browse_services" && services.length > 0 && (
          <div className="pl-8 grid grid-cols-1 gap-2.5 my-2">
            {services.map((svc) => (
              <ServiceCard
                key={svc.id}
                service={svc}
                isSelected={activeServiceCard?.id === svc.id}
                onSelect={(selected) => selectService(selected)}
              />
            ))}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3 bg-[#101426] border-t border-white/10 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              phase === "collect_name"
                ? "Type your full name..."
                : phase === "collect_phone"
                ? "Phone number..."
                : phase === "confirm"
                ? "Type 'yes' or 'no'..."
                : "Ask about a service, pricing..."
            }
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Modals */}
      <StatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        bookingId={bookingId}
        onClose={() => setIsFeedbackModalOpen(false)}
        onSubmitSuccess={() => {
          setIsFeedbackModalOpen(false);
          submitFeedback(5, "");
        }}
      />
    </div>
  );
};
