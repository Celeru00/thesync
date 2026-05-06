/** User roles in the system */
export type UserRole = "student" | "adviser" | "admin" | "panelist";

/** Panelist invitation statuses */
export type InviteStatus = "invited" | "accepted" | "declined";

/** Schedule statuses */
export type ScheduleStatus = "pending" | "approved" | "rejected" | "rescheduled" | "completed" | "cancelled";
