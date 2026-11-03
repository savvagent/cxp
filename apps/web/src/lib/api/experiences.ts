import { apiFetch } from "../api-client";
import type { Experience, PaginatedResponse } from "../types";

export const experiencesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiFetch<PaginatedResponse<Experience>>(
      `/experiences?limit=${params?.limit ?? 50}&offset=${params?.offset ?? 0}`,
    ),

  get: (id: string) => apiFetch<Experience>(`/experiences/${encodeURIComponent(id)}`),

  create: (data: { name: string; description?: string; teamId?: string | null }) =>
    apiFetch<Experience>("/experiences", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { name?: string; description?: string; teamId?: string | null }) =>
    apiFetch<Experience>(`/experiences/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/experiences/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
