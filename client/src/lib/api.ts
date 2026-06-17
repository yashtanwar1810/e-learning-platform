import axios from "axios";

const RAW_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "https://e-learning-platform-t37c.onrender.com/api";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

const TOKEN_KEY = "auth_token";

export const tokenStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
  auth?: boolean;
};

const client = axios.create({
  baseURL: API_BASE,
});

export async function apiFetch<T = unknown>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, formData, signal, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (!formData && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await client.request<T>({
      url: path,
      method,
      headers,
      signal,
      data: formData ?? (body !== undefined ? body : undefined),
    });
    return res.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      const payload = response?.data;
      const message =
        (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        typeof (payload as { message: unknown }).message === "string"
          ? (payload as { message: string }).message
          : response
            ? `Request failed (${response.status})`
            : `Cannot reach API at ${API_BASE}. Is your backend running?`);
      throw new ApiError(response?.status ?? 0, message, payload);
    }
    throw new ApiError(0, `Cannot reach API at ${API_BASE}. Is your backend running?`);
  }
}
