import { AuthPagePlaceholder } from "@/components/app/auth-page-placeholder";

export default function LoginPage() {
  return (
    <AuthPagePlaceholder
      badge="Authentication"
      title="Login"
      description="This placeholder reserves the login route outside of the shared student sidebar shell. Replace it with your real authentication form when ready."
      alternateHref="/register"
      alternateLabel="Go to register"
    />
  );
}
