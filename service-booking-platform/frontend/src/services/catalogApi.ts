import apiClient from "./apiClient";
import type { Category, Service } from "../types/catalog.types";

export interface CategoryWithServices extends Category {
  services: Service[];
}

export const catalogApi = {
  getMerchantInfo: (merchantId: string) =>
    apiClient.get<{ name: string; agent_greeting: string | null }>("/categories/info", {
      params: { merchant_id: merchantId },
    }),

  getCategories: (merchantId: string) =>
    apiClient.get<Category[]>("/categories", { params: { merchant_id: merchantId } }),

  getCatalogTree: (merchantId: string) =>
    apiClient.get<CategoryWithServices[]>("/categories/tree", { params: { merchant_id: merchantId } }),

  getServicesByCategory: (categoryId: string) =>
    apiClient.get<Service[]>(`/categories/${categoryId}/services`),

  searchCatalog: (merchantId: string, query: string) =>
    apiClient.get<Service[]>("/categories/search", { params: { merchant_id: merchantId, q: query } }),

  sendChatMessage: (data: {
    merchant_id: string;
    message: string;
    session_id?: string;
    history?: { role: string; content: string }[];
  }) =>
    apiClient.post<{
      session_id: string;
      response: string;
      matching_services: Service[];
      suggested_action?: string;
      suggestion_chips?: string[];
    }>("/chat", data),
};

