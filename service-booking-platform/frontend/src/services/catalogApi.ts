import apiClient from "./apiClient";
import type { Category, Service } from "../types/catalog.types";

export const catalogApi = {
  getCategories: (merchantId: string) =>
    apiClient.get<Category[]>("/categories", { params: { merchant_id: merchantId } }),

  getServicesByCategory: (categoryId: string) =>
    apiClient.get<Service[]>(`/categories/${categoryId}/services`),
};
