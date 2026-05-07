import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const supabase = await createClient();

  await supabase.auth.signOut();

  return response;
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: Request) {
  return signOutAndRedirect(request);
}
