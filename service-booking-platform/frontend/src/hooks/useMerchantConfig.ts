import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/adminApi";
import { useMerchant } from "../context/MerchantContext";
import type { AgentConfig } from "../types/config.types";

export function useMerchantConfig() {
  const { merchantId } = useMerchant();
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getConfig(merchantId);
      setConfig(res.data);
    } catch {
      setConfig({
        llm_provider: "openai",
        llm_model_id: "gpt-4o-mini",
        has_api_key: false,
        system_prompt: "You are a helpful, courteous service booking assistant.",
        agent_greeting: "Hello! Welcome to our store. How can I assist you with a service booking today?",
      });
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (data: Partial<AgentConfig> & { api_key?: string }) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await adminApi.updateConfig(merchantId, data);
      await fetchConfig();
      setStatusMessage({ type: "success", text: "Configuration saved securely." });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.detail || "Failed to update configuration.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const uploadCatalog = async (file: File) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await adminApi.uploadCatalog(merchantId, file);
      setStatusMessage({
        type: "success",
        text: `Catalog processed successfully! Created ${res.data.services_created} services across categories.`,
      });
      return res.data;
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.detail || "Failed to parse and upload catalog spreadsheet.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const uploadKnowledgeDocument = async (file: File) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await adminApi.uploadKnowledgeDoc(merchantId, file);
      setStatusMessage({
        type: "success",
        text: `Knowledge document uploaded and queued for vector embedding: ${file.name}`,
      });
      return { filename: file.name, url: res.data.url, message: res.data.message };
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.response?.data?.detail || "Failed to ingest knowledge document.",
      });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    config,
    loading,
    saving,
    statusMessage,
    updateConfig,
    uploadCatalog,
    uploadKnowledgeDocument,
    clearStatus: () => setStatusMessage(null),
  };
}
