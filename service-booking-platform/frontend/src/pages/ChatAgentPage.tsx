import React, { useState, useEffect, useRef } from "react";
import { useChatAgent } from "../hooks/useChatAgent";
import { useMerchant } from "../context/MerchantContext";
import { ServiceCard } from "../components/agent/ServiceCard";
import { StatusModal } from "../components/agent/StatusModal";
import { FeedbackModal } from "../components/agent/FeedbackModal";
import { Bot, Send, Sparkles, Search, RefreshCw, AlertTriangle } from "lucide-react";

export const ChatAgentPage: React.FC = () => {
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
    initChat();
  }, [initChat]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, services]);

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

  const agentTitle = profile?.name || "AI Service Assistant";
  const agentSubtitle = "Powered by Semantic Search & Dynamic LLM";

  return (

    <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col h-[calc(100vh-5rem)]">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">{agentTitle}</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] text-emerald-400 font-medium">Live</span>
            </div>
            <p className="text-xs text-slate-400">{agentSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStatusModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            Track Booking
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            title="Restart conversation"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Catalog Unavailable Alert */}
      {catalogUnavailable && (
        <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <strong className="block text-sm font-semibold">Catalog Not Initialized</strong>
            No active categories or services found. Please visit the{" "}
            <a href="/admin" className="underline font-bold text-amber-200">
              Merchant Admin
            </a>{" "}
            to upload a catalog spreadsheet or initialize merchant data.
          </div>
        </div>
      )}

      {/* Message History & Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 pr-1">
        {messages.map((m) => {
          const isAgent = m.sender === "agent";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isAgent ? "" : "flex-row-reverse"} animate-fade-in`}
            >
              {isAgent ? (
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                  You
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isAgent
                    ? "glass-panel text-slate-100 rounded-tl-sm"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20"
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
              </div>
            </div>
          );
        })}

        {/* Suggestion Chips */}
        {suggestionChips.length > 0 && (phase === "greeting" || phase === "browse_categories" || phase === "browse_services") && (
          <div className="pl-11 flex flex-wrap gap-2 my-2 animate-fade-in">
            {suggestionChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/25 text-indigo-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Service Cards */}
        {phase === "browse_services" && services.length > 0 && (

          <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 animate-fade-in">
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

      {/* Input Form Bar */}
      <form onSubmit={handleSend} className="pt-3 border-t border-white/10 shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              phase === "collect_name"
                ? "Type your full name..."
                : phase === "collect_phone"
                ? "Type your phone number (e.g. +1 555-0199)..."
                : phase === "collect_note"
                ? "Any special notes or 'no' to skip..."
                : phase === "confirm"
                ? "Type 'yes' to confirm or 'no' to adjust..."
                : "Ask about a service, pricing, or say hello..."
            }
            className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Booking Status / Cancellation Modal */}
      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />

      {/* Customer Experience Feedback Modal */}
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
