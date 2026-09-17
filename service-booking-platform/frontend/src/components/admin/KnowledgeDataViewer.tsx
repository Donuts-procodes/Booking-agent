import React from "react";
import type { KnowledgeDoc } from "../../services/adminApi";
import { FileText, Database, HardDrive, ExternalLink, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

interface KnowledgeDataViewerProps {
  documents: KnowledgeDoc[];
  loading: boolean;
  onRefresh: () => void;
}

export const KnowledgeDataViewer: React.FC<KnowledgeDataViewerProps> = ({
  documents,
  loading,
  onRefresh,
}) => {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatDate = (isoStr?: string): string => {
    if (!isoStr) return "Recently added";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            Stored Knowledge Documents
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {documents.length} {documents.length === 1 ? "document" : "documents"} stored in object storage & indexed into vector search
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl glass-panel border border-white/10 hover:border-white/20 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && documents.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-white/5">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-400" />
          Loading stored knowledge documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 glass-panel rounded-2xl border border-white/5 flex flex-col items-center gap-2">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <span>No knowledge documents uploaded yet. Upload a policy, FAQ, or guide above.</span>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
          {documents.map((doc) => (
            <div
              key={doc.key}
              className="p-3.5 rounded-2xl glass-panel border border-white/5 hover:border-white/10 transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-semibold text-white truncate">{doc.filename}</h5>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <span>{formatBytes(doc.size)}</span>
                    <span>&bull;</span>
                    <span>{formatDate(doc.last_modified)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">
                  <Database className="w-3 h-3" />
                  RAG Indexed
                </span>
                <span className="inline-flex sm:hidden items-center text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                </span>
                {doc.url && (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    title="View Document"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
