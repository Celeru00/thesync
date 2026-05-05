import { redirect } from "next/navigation";

import { RegisterFlow } from "@/components/auth/register-flow";
import {
  getAppUserWithRole,
  getAuthPrefill,
  getDashboardPathForRole,
  isRegistrationComplete,
  isSignupRole,
} from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

type RegisterPageProps = {
  searchParams: Promise<{
    flow?: string | string[];
    role?: string | string[];
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const params = await searchParams;
  const flowParam = Array.isArray(params.flow) ? params.flow[0] : params.flow;
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const initialRole = isSignupRole(roleParam) ? roleParam : null;
  const isSignupFlow = flowParam === "signup";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const registrationComplete = isRegistrationComplete(user);

  if (user) {
    const { account, errorCode } = await getAppUserWithRole(supabase, user.id);

    if (errorCode === "role-not-supported") {
      redirect("/login?error=role-not-supported");
    }

    if (account?.role === "admin" && !registrationComplete) {
      redirect("/login?error=admin-not-provisioned");
    }

    if (account && registrationComplete && !isSignupFlow) {
      redirect(getDashboardPathForRole(account.role));
    }
  }

  return (
    <RegisterFlow
      initialRole={initialRole}
      initialPrefill={getAuthPrefill(user)}
    />
  );
}
