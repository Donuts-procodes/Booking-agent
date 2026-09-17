import React, { useState, useEffect } from "react";
import type { AgentConfig, LLMProvider } from "../../types/config.types";
import { Key, Bot, Sparkles, MessageSquare, ShieldCheck, Check, AlertCircle } from "lucide-react";

interface ConfigEditorProps {
  config: AgentConfig | null;
  onSave: (data: Partial<AgentConfig> & { api_key?: string }) => Promise<void>;
  saving: boolean;
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ config, onSave, saving }) => {
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [modelId, setModelId] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [greeting, setGreeting] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider((config.llm_provider as LLMProvider) || "openai");
      setModelId(config.llm_model_id || "gpt-4o-mini");
      setSystemPrompt(config.system_prompt || "");
      setGreeting(config.agent_greeting || "");
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(false);
    await onSave({
      llm_provider: provider,
      llm_model_id: modelId,
      api_key: apiKey.trim() ? apiKey.trim() : undefined,
      system_prompt: systemPrompt,
      agent_greeting: greeting,
    });
    setSavedSuccess(true);
    setApiKey("");
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const modelOptions: Record<LLMProvider, { id: string; label: string; desc: string }[]> = {
    openai: [
      { id: "gpt-5", label: "GPT-5 (Next-Gen Frontier)", desc: "Consolidated frontier flagship with adaptive multimodal compute" },
      { id: "o3", label: "o3 (High-Intensity Reasoning)", desc: "Extensive RL & deliberate test-time CoT for complex architecture" },
      { id: "o3-mini", label: "o3-mini (High-Intensity Fast Reasoning)", desc: "High-speed deliberate reasoning for logic and code synthesis" },
      { id: "o1", label: "o1 (Foundation Reasoning)", desc: "Engineered for STEM problem-solving, math, and algorithmic proofs" },
      { id: "o1-mini", label: "o1-mini (Fast STEM Reasoning)", desc: "Lightweight, fast STEM and reasoning problem solver" },
      { id: "gpt-4o", label: "GPT-4o (Multimodal Workhorse)", desc: "Low-latency chat completions and high-concurrency tool use" },
      { id: "gpt-4o-mini", label: "GPT-4o mini (Low Latency / Cost)", desc: "Fast, cost-optimized structured JSON extraction" },
    ],
    anthropic: [
      { id: "claude-fable-5.1", label: "Claude Fable 5.1 (Frontier Reasoning)", desc: "Always-on adaptive thinking, 1M token context window" },
      { id: "claude-fable-5", label: "Claude Fable 5 (Long-Horizon Agent)", desc: "High-stakes agentic workflows with 1M token context" },
      { id: "claude-opus-5", label: "Claude Opus 5 (Heavyweight Enterprise)", desc: "Deep codebase refactoring & multi-agent coordination (1M context)" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5 (Production Workhorse)", desc: "High intelligence with balanced inference latency (1M context)" },
      { id: "claude-haiku-4.5", label: "Claude Haiku 4.5 (High Throughput)", desc: "Fast extraction & lightweight execution (200K context)" },
      { id: "claude-mythos-5.1", label: "Claude Mythos 5.1 (High Assurance)", desc: "Specialized tier tailored for high-security environments" },
    ],
    gemini: [
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended Workhorse)", desc: "Ultra-fast response time, cost-efficient multimodal conversational reasoning" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (Deep Reasoning)", desc: "Advanced reasoning for complex multi-turn service scheduling" },
      { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Legacy Fast)", desc: "High throughput lightweight assistant" },
      { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro (Heavyweight Frontier)", desc: "Deep multimodal reasoning across text, code, audio, and video" },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Multimodal Workhorse)", desc: "Fast time-to-first-token with robust tool calling" },
    ],

    deepseek: [
      { id: "deepseek-r1", label: "DeepSeek-R1 (Frontier Reasoning)", desc: "Trained via large-scale RL with transparent reasoning traces" },
      { id: "deepseek-v3", label: "DeepSeek-V3 (671B MoE Foundation)", desc: "High-capacity MoE model for general text, JSON, and code" },
    ],
    groq: [
      { id: "llama-3.1-405b", label: "Llama 3.1 405B (Frontier Open Weights)", desc: "Self-hosted high-capacity foundation reasoning via Groq LPUs" },
      { id: "llama-3.1-70b", label: "Llama 3.1 70B (Versatile Fast)", desc: "Ultra-fast inference for high-concurrency booking chat" },
      { id: "llama-3.1-8b", label: "Llama 3.1 8B (Sub-second Instant)", desc: "Ultra-low latency extraction and dialogue responses" },
      { id: "llama-3.2-90b-vision", label: "Llama 3.2 90B Vision", desc: "Native visual document & catalog understanding" },
      { id: "llama-3.2-11b-vision", label: "Llama 3.2 11B Vision", desc: "Efficient multimodal visual reasoning" },
      { id: "llama-3.2-3b", label: "Llama 3.2 3B (Edge Compact)", desc: "Ultra-compact edge and mobile deployments" },
      { id: "llama-3.2-1b", label: "Llama 3.2 1b (Lightweight Edge)", desc: "Minimal-footprint embedded classification" },
      { id: "deepseek-r1", label: "DeepSeek-R1 (Groq Accelerated)", desc: "Deliberative reasoning traces powered by Groq LPU speed" },
    ],
    ollama: [
      { id: "llama-3.1:405b", label: "Llama 3.1 405B (Local Enterprise)", desc: "Full-parameter on-premise frontier deployment" },
      { id: "llama-3.1:70b", label: "Llama 3.1 70B (Local Production)", desc: "Balanced local workstation production deployment" },
      { id: "llama-3.1:8b", label: "Llama 3.1 8B (Local Efficient)", desc: "Fast CPU/GPU local inferencing" },
      { id: "llama-3.2:3b", label: "Llama 3.2 3B (Local Edge)", desc: "Compact on-device local deployment" },
      { id: "llama-3.2:1b", label: "Llama 3.2 1B (Ultra-light)", desc: "Minimal resource footprint" },
      { id: "deepseek-r1", label: "DeepSeek-R1 (Local Reasoning)", desc: "Transparent chain-of-thought running fully on-premise" },
      { id: "deepseek-v3", label: "DeepSeek-V3 (Local MoE)", desc: "High-capacity Mixture-of-Experts self-hosted" },
    ],
  };

  const currentModels = modelOptions[provider] || [];
  const selectedModelMeta = currentModels.find((m) => m.id === modelId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-indigo-400" />
            LLM Provider (BYOK)
          </label>
          <select
            value={provider}
            onChange={(e) => {
              const newProv = e.target.value as LLMProvider;
              setProvider(newProv);
              const defaultModel = modelOptions[newProv]?.[0]?.id || "gpt-5";
              setModelId(defaultModel);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="openai" className="bg-slate-900 text-white">OpenAI</option>
            <option value="anthropic" className="bg-slate-900 text-white">Anthropic</option>
            <option value="gemini" className="bg-slate-900 text-white">Google Gemini</option>
            <option value="deepseek" className="bg-slate-900 text-white">DeepSeek</option>
            <option value="groq" className="bg-slate-900 text-white">Meta (via Groq LPUs)</option>
            <option value="ollama" className="bg-slate-900 text-white">Ollama (Local / On-Premise)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Model Selection
          </label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
          >
            {currentModels.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-slate-900 text-white">
                {opt.label}
              </option>
            ))}
          </select>
          {selectedModelMeta && (
            <p className="text-[11px] text-indigo-300/80 mt-1.5 px-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {selectedModelMeta.desc}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            Provider API Key (AES-256 Encrypted at rest)
          </span>
          {config?.has_api_key && (
            <span className="text-emerald-400 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Key securely configured
            </span>
          )}
        </label>
        <input
          type="password"
          placeholder={config?.has_api_key ? "••••••••••••••••••••••••••••• (Leave blank to keep existing key)" : "Enter API key..."}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Keys are encrypted using AES-256-GCM authenticated encryption before being saved to PostgreSQL.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          Agent Greeting Message
        </label>
        <input
          type="text"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="e.g. Welcome to our salon! How can I help you today?"
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <FileTextIcon className="w-3.5 h-3.5 text-indigo-400" />
          System Prompt & Guardrails
        </label>
        <textarea
          rows={4}
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="Instructions guiding how the conversational booking agent interacts with customers..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 resize-none font-mono"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        {savedSuccess ? (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Changes saved and active!
          </span>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "Saving..." : "Save Agent Configuration"}
        </button>
      </div>
    </form>
  );
};

const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
