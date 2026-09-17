import apiClient from "./apiClient";
import type { AgentConfig } from "../types/config.types";

export interface CreateStaffParams {
  merchant_id: string;
  name: string;
  email: string;
  password: string;
}

export interface StaffCreatedResponse {
  staff_id: string;
  name: string;
  email: string;
}

export interface KnowledgeDoc {
  key: string;
  filename: string;
  size: number;
  last_modified?: string;
  url: string;
}

export const adminApi = {
  getConfig: (merchantId: string) =>
    apiClient.get<AgentConfig>(`/admin/config/${merchantId}`),

  updateConfig: (merchantId: string, data: Partial<AgentConfig & { api_key: string }>) =>
    apiClient.patch<AgentConfig>(`/admin/config/${merchantId}`, data),

  uploadCatalog: (merchantId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ message: string; categories_created: number; services_created: number }>(
      `/admin/catalog/upload?merchant_id=${merchantId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  uploadKnowledgeDoc: (merchantId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<{ message: string; key: string; filename: string; size: number; url: string }>(
      `/admin/knowledge-docs?merchant_id=${merchantId}`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
  },

  getKnowledgeDocs: (merchantId: string) =>
    apiClient.get<KnowledgeDoc[]>("/admin/knowledge-docs", {
      params: { merchant_id: merchantId },
    }),

  createStaff: (params: CreateStaffParams) =>
    apiClient.post<StaffCreatedResponse>(
      `/admin/staff?merchant_id=${encodeURIComponent(params.merchant_id)}&name=${encodeURIComponent(params.name)}&email=${encodeURIComponent(params.email)}&password=${encodeURIComponent(params.password)}`
    ),
};

