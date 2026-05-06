const DEFAULT_LOCAL_APP_URL = "http://localhost:3000";

function normalizeOrigin(value: string) {
  return new URL(value).origin;
}

function getConfiguredAppUrl() {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredAppUrl) {
    return normalizeOrigin(configuredAppUrl);
  }

  return DEFAULT_LOCAL_APP_URL;
}

export function getBrowserAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return getConfiguredAppUrl();
}

export function getRequestAppOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost && forwardedProto) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return normalizeOrigin(request.url);
}

export function buildAuthCallbackUrl(
  origin: string,
  options: {
    flow: "login" | "signup";
    role?: string | null;
  },
) {
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("flow", options.flow);

  if (options.role) {
    callbackUrl.searchParams.set("role", options.role);
  }

  return callbackUrl;
}
