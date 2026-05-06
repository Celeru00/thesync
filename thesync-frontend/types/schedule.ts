/** Minimal user fields embedded inside a ScheduleDetail response */
export interface UserSummary {
  id: string;
  full_name: string;
}

/** Panelist assignment entry with resolved names (for ScheduleDetail) */
export interface PanelistDetail {
  id: string;
  panelist_id: string;
  full_name: string;
  invite_status: string;
}

/**
 * Full schedule detail response for GET /schedules/{id}
 *
 * Differences from Schedule:
 * - student/adviser are embedded UserSummary objects instead of raw UUIDs
 * - type and status are resolved name strings
 * - panelist_assignments contains resolved names
 * - meet_link is only populated when status == approved
 * - google_calendar_event_id is only populated for admin/adviser callers
 */
export interface ScheduleDetail {
  id: string;
  topic: string;
  student: UserSummary;
  adviser: UserSummary;
  type: string;
  status: string;
  requested_at: string;
  scheduled_at: string | null;
  meet_link: string | null;
  google_calendar_event_id: string | null;
  panelist_assignments: PanelistDetail[];
  created_at: string;
}

/** Domain and API representation of a schedule request */
export interface Schedule {
  id: string;
  student_id: string;
  adviser_id: string;
  type_id: number;
  status_id: number;
  topic: string;
  requested_at: string;
  scheduled_at: string | null;
  google_calendar_event_id: string | null;
  meet_link: string | null;
  created_at: string;
}

/** Expanded schedule row returned by list endpoints */
export interface ScheduleListItem extends Schedule {
  student_full_name: string;
  adviser_full_name: string;
  type_name: string;
  status_name: string;
}

/** Paginated schedule list response */
export interface ScheduleListResponse {
  items: ScheduleListItem[];
  total: number;
  page: number;
  limit: number;
}

/** Payload for creating a schedule request */
export interface ScheduleCreateRequest {
  adviser_id: string;
  type_id: number;
  topic: string;
  scheduled_at: string;
}

/** Payload for approving a schedule */
export interface ScheduleApproveRequest {
  scheduled_at?: string | null;
}

/** Payload for rejecting a schedule */
export interface ScheduleRejectRequest {
  remarks?: string | null;
}

/** Payload for rescheduling a schedule */
export interface ScheduleRescheduleRequest {
  scheduled_at: string;
  remarks?: string | null;
}
