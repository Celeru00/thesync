import type { AxiosError } from "axios";

import type { ConsultationRequestType } from "@/lib/mock/student-consultations";

export type ConsultationRequestFieldName =
  | "scheduleType"
  | "selectedAdviserId"
  | "preferredDate"
  | "selectedTimeSlot"
  | "topic";

type BackendErrorPayload = {
  detail?:
    | string
    | {
        message?: string;
        reason?: string;
      }
    | Array<{
        loc?: Array<string | number>;
        msg?: string;
      }>;
};

export const scheduleTypeIdByValue: Record<ConsultationRequestType, number> = {
  defense: 1,
  consultation: 2,
};

export function buildScheduledAtIso(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  const localDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

  return localDateTime.toISOString();
}

export function parseConsultationRequestError(error: unknown): {
  submitError: string | null;
  fieldErrors?: Partial<Record<ConsultationRequestFieldName, string>>;
} {
  const fallbackMessage = "We couldn't submit your request. Please try again.";

  if (!isAxiosErrorWithPayload(error)) {
    return { submitError: fallbackMessage };
  }

  if (error.response?.status === 409) {
    return {
      submitError: "This time slot is unavailable — please pick another",
    };
  }

  if (error.response?.status === 422) {
    const detail = error.response.data?.detail;

    if (Array.isArray(detail)) {
      return {
        submitError: null,
        fieldErrors: mapValidationIssues(detail),
      };
    }

    if (typeof detail === "string") {
      return { submitError: detail };
    }
  }

  if (typeof error.response?.data?.detail === "string") {
    return { submitError: error.response.data.detail };
  }

  if (
    typeof error.response?.data?.detail === "object" &&
    error.response?.data?.detail &&
    "message" in error.response.data.detail &&
    typeof error.response.data.detail.message === "string"
  ) {
    return { submitError: error.response.data.detail.message };
  }

  return { submitError: fallbackMessage };
}

function mapValidationIssues(
  issues: Array<{
    loc?: Array<string | number>;
    msg?: string;
  }>,
): Partial<Record<ConsultationRequestFieldName, string>> {
  const fieldErrors: Partial<Record<ConsultationRequestFieldName, string>> = {};

  for (const issue of issues) {
    const fieldName = issue.loc?.[issue.loc.length - 1];
    const message = issue.msg;

    if (typeof fieldName !== "string" || typeof message !== "string") {
      continue;
    }

    if (fieldName === "type_id") {
      fieldErrors.scheduleType = message;
    } else if (fieldName === "adviser_id") {
      fieldErrors.selectedAdviserId = message;
    } else if (fieldName === "scheduled_at") {
      fieldErrors.selectedTimeSlot = message;
    } else if (fieldName === "topic") {
      fieldErrors.topic = message;
    }
  }

  return fieldErrors;
}

function isAxiosErrorWithPayload(
  error: unknown,
): error is AxiosError<BackendErrorPayload> {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as { isAxiosError?: boolean }).isAxiosError === true
  );
}
