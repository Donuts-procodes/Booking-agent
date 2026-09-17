import React, { useState, useCallback } from "react";
import { useStaffQueue } from "../hooks/useStaffQueue";
import { QueueCard } from "../components/staff/QueueCard";
import { FinalizeModal } from "../components/staff/FinalizeModal";
import { Users, LogIn, LogOut, RefreshCw, AlertCircle, Inbox, Lock, Mail, Search } from "lucide-react";

type FilterTab = "all" | "pending" | "accepted" | "unassigned";

export const StaffDashboardPage: React.FC = () => {
  const {
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
  } = useStaffQueue();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterTab>("all");
  const [finalizeBookingId, setFinalizeBookingId] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setLoginError(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, [setSearchTerm]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue(searchTerm);
  }, [fetchQueue, searchTerm]);

  const filteredQueue = queue.filter((item) => {
    if (filter === "all") return true;
    if (filter === "unassigned") return !item.assigned_staff_id;
    return item.status === filter;
  });

  const tabConfig: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: counts.total },
    { id: "pending", label: "Pending", count: counts.pending },
    { id: "accepted", label: "Accepted", count: counts.accepted },
    { id: "unassigned", label: "Unassigned", count: counts.unassigned },
  ];

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
        <div className="glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/30">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Staff Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your dispatch queue and manage customer service bookings.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Staff Email
              </label>
              <input
                type="email"
                required
                placeholder="staff@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {loginLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white tracking-tight">Staff Dispatch Dashboard</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Online
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Logged in as <span className="text-indigo-300 font-semibold">{staffName}</span> • Auto-refreshes every 10s
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchQueue()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearchSubmit} className="my-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by customer name, phone, booking ID, or service..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
      </form>

      {/* Error notification */}
      {error && (
        <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs with dynamic counts */}
      <div className="flex items-center gap-2 my-6 flex-wrap">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              filter === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Queue items list */}
      {filteredQueue.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 my-8">
          <div className="w-12 h-12 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-white">Queue is clear</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No booking requests currently matching your filter. Incoming bookings assigned by the least-loaded router will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQueue.map((item) => (
            <QueueCard
              key={item.booking_id}
              item={item}
              onAccept={async (id) => {
                await respondToBooking(id, "accept");
              }}
              onReject={async (id, reason) => {
                await respondToBooking(id, "reject", reason);
              }}
              onClaim={async (id) => {
                await claimBooking(id);
              }}
              onOpenFinalize={(id) => setFinalizeBookingId(id)}
            />
          ))}
        </div>
      )}

      {/* Finalize Modal */}
      {finalizeBookingId && (
        <FinalizeModal
          isOpen={true}
          bookingId={finalizeBookingId}
          onClose={() => setFinalizeBookingId(null)}
          onConfirm={async (notes, price) => {
            await finalizeBooking(finalizeBookingId, notes, price);
          }}
        />
      )}
    </div>
  );
};
