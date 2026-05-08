import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { isRecoverableSessionError } from "@/lib/supabase/errors";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { error } = await supabase.auth.getUser();

    if (error && !isRecoverableSessionError(error)) {
      throw error;
    }
  } catch (error) {
    if (isRecoverableSessionError(error)) {
      return response;
    }

    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase auth fetch failed in development. Continuing without auth check.",
        error,
      );
      return response;
    }

    throw error;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
