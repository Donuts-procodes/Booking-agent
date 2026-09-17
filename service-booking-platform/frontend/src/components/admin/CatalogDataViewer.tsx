import React from "react";
import type { CategoryWithServices } from "../../services/catalogApi";
import { Folder, Layers, Tag, Image as ImageIcon, AlertCircle, RefreshCw } from "lucide-react";

interface CatalogDataViewerProps {
  categories: CategoryWithServices[];
  loading: boolean;
  onRefresh: () => void;
}

export const CatalogDataViewer: React.FC<CatalogDataViewerProps> = ({
  categories,
  loading,
  onRefresh,
}) => {
  const totalServices = categories.reduce((acc, cat) => acc + (cat.services?.length || 0), 0);

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Ingested Services & Categories
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {categories.length} {categories.length === 1 ? "category" : "categories"} &bull; {totalServices} live {totalServices === 1 ? "service" : "services"} stored in database
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl glass-panel border border-white/10 hover:border-white/20 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-white/5">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
          Loading ingested catalog items...
        </div>
      ) : categories.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-white/5 flex flex-col items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <span>No catalog data ingested yet. Upload an Excel or CSV file above to populate.</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass-panel rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Folder className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-white">{cat.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {cat.services?.length || 0} items
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  ID: {cat.id.slice(0, 8)}...
                </span>
              </div>

              {cat.services && cat.services.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {cat.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-white line-clamp-1">{srv.name}</h5>
                          {srv.image_url ? (
                            <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 border border-white/10 bg-slate-800">
                              <img
                                src={srv.image_url}
                                alt={srv.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            </div>
                          ) : (
                            <ImageIcon className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                        </div>
                        {srv.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                            {srv.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                        <span className="text-[11px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-500" />
                          {srv.price_range || "Price on request"}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                          Active
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No services listed in this category.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
