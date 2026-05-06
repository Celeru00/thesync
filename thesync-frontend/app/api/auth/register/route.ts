import { NextResponse } from "next/server";

import {
  BackendAuthError,
  completeBackendRegistration,
} from "@/lib/auth/backend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    console.log("[frontend-auth] register_proxy_missing_session", {
      hasSession: Boolean(session?.access_token),
      sessionError,
    });

    return NextResponse.json(
      {
        error_code: "session-missing",
        message:
          "Your sign-in session could not be found. Please sign in again.",
      },
      { status: 401 },
    );
  }

  const payload = (await request.json()) as {
    role: "student" | "adviser";
    full_name: string;
    email: string;
    avatar_url?: string | null;
    identifier: string;
    degree_program?: string | null;
    department: string;
  };

  console.log("[frontend-auth] register_proxy_forwarding", {
    role: payload.role,
    hasAvatar: Boolean(payload.avatar_url),
    hasIdentifier: Boolean(payload.identifier?.trim()),
    hasDegreeProgram: Boolean(payload.degree_program?.trim()),
    hasDepartment: Boolean(payload.department?.trim()),
    hasAccessToken: Boolean(session.access_token),
  });

  try {
    const appUser = await completeBackendRegistration(
      session.access_token,
      payload,
    );

    console.log("[frontend-auth] register_proxy_success", {
      userId: appUser.id,
      role: appUser.app_role,
    });
    return NextResponse.json(appUser);
  } catch (error) {
    if (error instanceof BackendAuthError) {
      console.log("[frontend-auth] register_proxy_backend_failed", {
        code: error.code,
        status: error.status,
        message: error.message,
      });

      return NextResponse.json(
        {
          error_code: error.code ?? "registration-failed",
          message: error.message,
        },
        { status: error.status },
      );
    }

    throw error;
  }
}
