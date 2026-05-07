import { redirect } from "next/navigation";

import { RegisterFlow } from "@/components/auth/register-flow";
import { getPublicServerAuthState } from "@/lib/auth/server";
import {
  getAuthPrefill,
  getDashboardPathForRole,
  isSignupRole,
} from "@/lib/auth/profile";

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
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const initialRole = isSignupRole(roleParam) ? roleParam : null;
  const { authUser, appUser } = await getPublicServerAuthState();

  if (!authUser) {
    redirect("/login");
  }

  if (appUser) {
    redirect(getDashboardPathForRole(appUser.app_role));
  }

  return (
    <RegisterFlow
      initialRole={initialRole}
      initialPrefill={getAuthPrefill(authUser)}
    />
  );
}
