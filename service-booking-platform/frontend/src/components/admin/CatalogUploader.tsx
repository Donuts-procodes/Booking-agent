import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface CatalogUploaderProps {
  onUpload: (file: File) => Promise<{ categories_created: number; services_created: number }>;
}

export const CatalogUploader: React.FC<CatalogUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ categories_created: number; services_created: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await onUpload(file);
      setResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Failed to process catalog spreadsheet.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/[0.04]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white">
          {file ? file.name : "Click or drag & drop service catalog spreadsheet"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports .xlsx or .csv. Required columns: <code className="text-indigo-300 font-mono">name</code>,{" "}
          <code className="text-indigo-300 font-mono">category</code>, <code className="text-indigo-300 font-mono">description</code>,{" "}
          <code className="text-indigo-300 font-mono">price_range</code>.
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Upload Catalog
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Catalog imported successfully!</span>
            <span className="text-emerald-400/80">
              Created {result.categories_created} new categories and {result.services_created} services. Live and searchable by the AI agent.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
