type SupabaseErrorLike = {
  code?: string;
  status?: number;
  message?: string;
};

export function isRefreshTokenNotFoundError(
  error: unknown,
): error is SupabaseErrorLike {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as SupabaseErrorLike;

  return (
    candidate.code === "refresh_token_not_found" ||
    candidate.message === "Invalid Refresh Token: Refresh Token Not Found"
  );
}
