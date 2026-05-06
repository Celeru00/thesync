export function getCalendarStatusMessage(statusCode?: string | null) {
  if (statusCode === "connected") {
    return "Google Calendar connected successfully.";
  }

  if (statusCode === "missing-provider-token") {
    return "Google Calendar access was granted, but Google did not return a refresh token. Please try connecting again.";
  }

  if (statusCode === "connect-failed") {
    return "Google Calendar could not be connected. Please try again.";
  }

  if (statusCode === "missing-code") {
    return "Google Calendar connection did not finish. Please try again.";
  }

  return null;
}
