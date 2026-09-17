import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Database } from "lucide-react";

interface KnowledgeUploaderProps {
  onUpload: (file: File) => Promise<{ filename: string; url?: string; message?: string; chunks_indexed?: number }>;
}

export const KnowledgeUploader: React.FC<KnowledgeUploaderProps> = ({ onUpload }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ filename: string; url?: string; message?: string; chunks_indexed?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
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
      setError(err?.message || "Failed to ingest knowledge document into vector store.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-purple-400 bg-purple-500/10 scale-[1.01]"
            : "border-white/10 hover:border-purple-500/50 bg-white/[0.02] hover:bg-white/[0.04]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 transition-colors ${
          isDragging ? "bg-purple-500/20 text-purple-300" : "bg-purple-500/10 text-purple-400"
        }`}>
          <Database className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-white">
          {file ? file.name : isDragging ? "Drop document here..." : "Upload business policies, FAQs, or service brochures"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Supports .pdf, .docx, .txt, and .md. Documents are chunked (512 tokens) and indexed into Milvus vector store for RAG answers.
        </p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-200">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Embedding...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Index into RAG
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
            <span className="font-semibold block">Knowledge Base Indexed!</span>
            <span className="text-emerald-400/80">
              Extracted and embedded {result.chunks_indexed} semantic chunks from <span className="font-mono">{result.filename}</span> into Milvus.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
