export function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_API_BASE_URL. Set it in .env.local or your deployment environment.",
    );
  }

  return apiBaseUrl.replace(/\/+$/, "");
}
