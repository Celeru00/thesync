import { NextResponse } from "next/server";

import { BackendAuthError, deleteBackendAccount } from "@/lib/auth/backend";
import { createClient } from "@/lib/supabase/server";

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    return NextResponse.json(
      {
        error_code: "session-missing",
        message:
          "Your sign-in session could not be found. Please sign in again.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await deleteBackendAccount(session.access_token);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BackendAuthError) {
      return NextResponse.json(
        {
          error_code: error.code ?? "account-deletion-failed",
          message: error.message,
        },
        { status: error.status },
      );
    }

    throw error;
  }
}
