import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { catalogApi } from "../services/catalogApi";

export interface MerchantProfile {
  name: string;
  agent_greeting: string | null;
  llm_provider?: string | null;
  system_prompt?: string | null;
}

interface MerchantContextValue {
  merchantId: string;
  profile: MerchantProfile | null;
  profileLoading: boolean;
  setMerchantId: (id: string) => void;
  refreshProfile: () => Promise<void>;
}

const STORAGE_KEY = "Booking Agent_merchant_id";
const ENV_FALLBACK = import.meta.env.VITE_MERCHANT_ID || "00000000-0000-0000-0000-000000000001";

function resolveMerchantId(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("merchant_id");
    if (fromUrl) {
      localStorage.setItem(STORAGE_KEY, fromUrl);
      return fromUrl;
    }
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (fromStorage) return fromStorage;
  }
  return ENV_FALLBACK;
}

const MerchantContext = createContext<MerchantContextValue | undefined>(undefined);

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchantId, setMerchantIdState] = useState<string>(resolveMerchantId);
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const setMerchantId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setMerchantIdState(id);
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const res = await catalogApi.getMerchantInfo(merchantId);
      setProfile(res.data);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [merchantId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<MerchantContextValue>(
    () => ({ merchantId, profile, profileLoading, setMerchantId, refreshProfile }),
    [merchantId, profile, profileLoading, setMerchantId, refreshProfile],
  );

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
};

export function useMerchant(): MerchantContextValue {
  const ctx = useContext(MerchantContext);
  if (!ctx) throw new Error("useMerchant must be used within MerchantProvider");
  return ctx;
}
