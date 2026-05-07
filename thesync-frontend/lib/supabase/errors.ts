type SupabaseErrorLike = {
  code?: string;
  status?: number;
  message?: string;
  name?: string;
  __isAuthError?: boolean;
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

export function isAuthSessionMissingError(
  error: unknown,
): error is SupabaseErrorLike {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as SupabaseErrorLike;

  return (
    candidate.name === "AuthSessionMissingError" ||
    candidate.message === "Auth session missing!"
  );
}

export function isRecoverableSessionError(
  error: unknown,
): error is SupabaseErrorLike {
  return isRefreshTokenNotFoundError(error) || isAuthSessionMissingError(error);
}
