import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

import { getApiBaseUrl } from "@/lib/api/env";
import { createClient } from "@/lib/supabase/client";

let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (typeof window === "undefined") {
    return null;
  }

  supabaseClient ??= createClient();
  return supabaseClient;
}

async function attachAuthorizationHeader(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return config;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return config;
    }

    if (config.headers instanceof AxiosHeaders) {
      config.headers.set("Authorization", `Bearer ${session.access_token}`);
      return config;
    }

    config.headers = new AxiosHeaders(config.headers);
    config.headers.set("Authorization", `Bearer ${session.access_token}`);

    return config;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // Supabase may be unreachable in local development; proceed without auth.
      // Requests may still fail if the backend requires a valid session.
      console.warn("Unable to attach Supabase auth header:", error);
      return config;
    }

    throw error;
  }
}

export const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(attachAuthorizationHeader);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const supabase = getSupabaseClient();

      if (supabase) {
        await supabase.auth.signOut();
      }

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);
