import { AuthPagePlaceholder } from "@/components/app/auth-page-placeholder";

export default function RegisterPage() {
  return (
    <AuthPagePlaceholder
      badge="Authentication"
      title="Register"
      description="This placeholder reserves the registration route outside of the shared student sidebar shell. Replace it with your onboarding flow when ready."
      alternateHref="/login"
      alternateLabel="Go to login"
    />
  );
}
