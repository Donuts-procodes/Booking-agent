import React, { useState, useEffect, useCallback } from "react";
import { useMerchantConfig } from "../hooks/useMerchantConfig";
import { useMerchant } from "../context/MerchantContext";
import { ConfigEditor } from "../components/admin/ConfigEditor";
import { CatalogUploader } from "../components/admin/CatalogUploader";
import { KnowledgeUploader } from "../components/admin/KnowledgeUploader";
import { CatalogDataViewer } from "../components/admin/CatalogDataViewer";
import { KnowledgeDataViewer } from "../components/admin/KnowledgeDataViewer";
import { adminApi, type KnowledgeDoc } from "../services/adminApi";
import { catalogApi, type CategoryWithServices } from "../services/catalogApi";
import { Bot, FileSpreadsheet, Database, UserPlus, Sparkles, ShieldCheck, Check, AlertCircle } from "lucide-react";

export const MerchantAdminPage: React.FC = () => {
  const { merchantId, profile } = useMerchant();
  const {
    config,
    saving,
    updateConfig,
    uploadCatalog,
    uploadKnowledgeDocument,
  } = useMerchantConfig();

  const [activeTab, setActiveTab] = useState<"config" | "catalog" | "knowledge" | "staff">("config");

  const [catalogCategories, setCatalogCategories] = useState<CategoryWithServices[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);

  const fetchCatalogData = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await catalogApi.getCatalogTree(merchantId);
      setCatalogCategories(res.data);
    } catch (err) {
      console.error("Failed to load catalog tree:", err);
    } finally {
      setCatalogLoading(false);
    }
  }, [merchantId]);

  const fetchKnowledgeDocs = useCallback(async () => {
    setKnowledgeLoading(true);
    try {
      const res = await adminApi.getKnowledgeDocs(merchantId);
      setKnowledgeDocs(res.data);
    } catch (err) {
      console.error("Failed to load knowledge docs:", err);
    } finally {
      setKnowledgeLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchCatalogData();
    fetchKnowledgeDocs();
  }, [fetchCatalogData, fetchKnowledgeDocs]);

  const handleCatalogUpload = async (file: File) => {
    const res = await uploadCatalog(file);
    await fetchCatalogData();
    return res;
  };

  const handleKnowledgeUpload = async (file: File) => {
    const res = await uploadKnowledgeDocument(file);
    await fetchKnowledgeDocs();
    return res;
  };

  // Staff provisioning state
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [staffSuccess, setStaffSuccess] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisioning(true);
    setStaffSuccess(null);
    setStaffError(null);
    try {
      const res = await adminApi.createStaff({
        merchant_id: merchantId,
        name: staffName.trim(),
        email: staffEmail.trim(),
        password: staffPassword.trim(),
      });
      setStaffSuccess(`Staff member "${res.data.name}" (${res.data.email}) created successfully!`);
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
    } catch (err: any) {
      setStaffError(err?.response?.data?.detail || "Failed to create staff account.");
    } finally {
      setProvisioning(false);
    }
  };

  const merchantTitle = profile?.name || "Merchant Control Center";

  const tabs = [
    { id: "config", label: "AI & BYOK LLM", icon: Bot, desc: "Provider keys, models, system prompt" },
    { id: "catalog", label: "Catalog Ingestion", icon: FileSpreadsheet, desc: "Excel & CSV service upload" },
    { id: "knowledge", label: "Knowledge Base", icon: Database, desc: "PDF & DOCX vector embeddings" },
    { id: "staff", label: "Staff Dispatch", icon: UserPlus, desc: "Provision operators and accounts" },
  ] as const;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/25">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{merchantTitle}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Merchant ID: <span className="font-mono text-indigo-300">{merchantId}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600/15 border-indigo-500/40 shadow-lg shadow-indigo-600/10 text-white"
                  : "glass-panel border-white/5 text-slate-400 hover:text-slate-200 hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span className="text-sm font-bold block">{tab.label}</span>
              </div>
              <span className="text-[11px] text-slate-400 block line-clamp-1">{tab.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
        {activeTab === "config" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                BYOK (Bring Your Own Key) & Agent Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure which language model powers customer conversations. API keys are encrypted at rest with AES-256-GCM.
              </p>
            </div>
            <ConfigEditor
              config={config}
              onSave={updateConfig}
              saving={saving}
            />
          </div>
        )}

        {activeTab === "catalog" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Service Catalog Spreadsheet Parser
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Upload your service list in Excel or CSV format. Categories will be auto-generated and active services made immediately available in the chat agent.
              </p>
            </div>
            <CatalogUploader onUpload={handleCatalogUpload} />
            <CatalogDataViewer
              categories={catalogCategories}
              loading={catalogLoading}
              onRefresh={fetchCatalogData}
            />
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Vector Knowledge Base & RAG Indexing
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Documents are split into 512-token chunks with 10% overlap, converted to dense vector embeddings, and indexed into Milvus for high-accuracy RAG retrieval.
              </p>
            </div>
            <KnowledgeUploader onUpload={handleKnowledgeUpload} />
            <KnowledgeDataViewer
              documents={knowledgeDocs}
              loading={knowledgeLoading}
              onRefresh={fetchKnowledgeDocs}
            />
          </div>
        )}

        {activeTab === "staff" && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Provision Staff Specialist Accounts
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Create operator logins. Staff members will receive assigned bookings automatically via the least-loaded round-robin router.
              </p>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Specialist Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address (Login Username)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sarah@example.com"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {staffError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              {staffSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{staffSuccess}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={provisioning}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {provisioning ? "Creating Account..." : "Create Staff Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
