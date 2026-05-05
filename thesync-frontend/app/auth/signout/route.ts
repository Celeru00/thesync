import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const supabase = await createClient();

  await supabase.auth.signOut();

  return response;
}
