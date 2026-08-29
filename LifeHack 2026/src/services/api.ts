import type { Readiness } from "../readiness";

export type ApiReadinessResponse = { readiness: Readiness };

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function analyzeProduct(jsonInput: string) {
  return request<{ result: unknown; product_id?: string }>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({ json_input: jsonInput }),
  });
}

export function getReadiness(productId: string) {
  return request<ApiReadinessResponse>(`/api/products/${encodeURIComponent(productId)}/readiness`);
}

export function runStressTest(productId: string) {
  return request<ApiReadinessResponse>(`/api/products/${encodeURIComponent(productId)}/stress-tests`, { method: "POST" });
}

export function submitAnswer(questionId: string | number, answer: string) {
  return request<ApiReadinessResponse>(`/api/questions/${encodeURIComponent(questionId)}/answers`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

export function retestScenario(scenarioId: string | number) {
  return request<ApiReadinessResponse>(`/api/stress-tests/${encodeURIComponent(scenarioId)}/retest`, { method: "POST" });
}
