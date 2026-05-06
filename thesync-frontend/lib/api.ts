import type {
  AdviserDashboardData,
  ActivityItem,
  SessionStatus,
  SessionType,
  StudentDashboardData,
} from "@/types/dashboard";

import { axiosInstance } from "@/lib/axiosInstance";

export type UUID = string;
export type ISODateTimeString = string;
export type ISODateString = string;

export type Schedule = {
  id: UUID;
  student_id: UUID;
  adviser_id: UUID;
  type_id: number;
  status_id: number;
  topic: string;
  requested_at: ISODateTimeString;
  scheduled_at: ISODateTimeString | null;
  google_calendar_event_id: string | null;
  meet_link: string | null;
  created_at: ISODateTimeString;
};

export type ScheduleListItem = Schedule & {
  student_full_name: string;
  adviser_full_name: string;
  type_name: string;
  status_name: string;
};

export type ScheduleListResponse = {
  items: ScheduleListItem[];
  total: number;
  page: number;
  limit: number;
};

export type CreateScheduleRequest = {
  adviser_id: UUID;
  type_id: number;
  topic: string;
  scheduled_at: ISODateTimeString;
};

export type ListSchedulesFilters = {
  status?: string;
  type?: string;
  from?: ISODateString | ISODateTimeString;
  to?: ISODateString | ISODateTimeString;
  page?: number;
  limit?: number;
};

export type RejectScheduleRequest = {
  remarks?: string;
};

export type ApproveScheduleRequest = {
  scheduled_at?: ISODateTimeString;
};

export type RescheduleScheduleRequest = {
  scheduled_at: ISODateTimeString;
  remarks?: string;
};

export type AvailabilitySlot = {
  id: UUID;
  adviser_id: UUID;
  slot_start: ISODateTimeString;
  slot_end: ISODateTimeString;
  is_blocked: boolean;
};

export type CreateAvailabilitySlotRequest = {
  slot_start: ISODateTimeString;
  slot_end: ISODateTimeString;
  is_blocked?: boolean;
};

export type UpdateAvailabilitySlotBlockedRequest = {
  is_blocked: boolean;
};

export type Notification = {
  id: UUID;
  user_id: UUID;
  schedule_id: UUID | null;
  message: string;
  is_read: boolean;
  created_at: ISODateTimeString;
};

export type NotificationListResponse = {
  items: Notification[];
  total: number;
  page: number;
  page_size: number;
  total_unread: number;
};

export type ListNotificationsParams = {
  limit?: number;
  offset?: number;
};

export type MarkAllNotificationsReadResult = {
  updated_count: number;
};

export type AdviserDirectoryUser = {
  id: UUID;
  role_id: number;
  role_name: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  identifier: string | null;
  department: string | null;
  created_at: ISODateTimeString;
};

type DashboardActivityApiResponse = {
  id: UUID;
  activity_type: ActivityItem["type"];
  title: string;
  message: string;
  created_at: ISODateTimeString;
};

type DashboardSessionApiResponse = {
  id: UUID;
  title: string;
  counterpart_name: string;
  scheduled_at: ISODateTimeString;
  ends_at: ISODateTimeString;
  status_name: string;
  type_name: string;
};

type StudentDashboardApiResponse = {
  current_user_name: string;
  stats: {
    upcoming_sessions: number;
    pending_requests: number;
    completed: number;
    total_hours: number;
  };
  upcoming_sessions: DashboardSessionApiResponse[];
  recent_activity: DashboardActivityApiResponse[];
};

type AdviserDashboardApiResponse = {
  current_user_name: string;
  stats: {
    pending_approvals: number;
    todays_sessions: number;
    active_advisees: number;
    this_month: number;
  };
  upcoming_sessions: DashboardSessionApiResponse[];
  recent_activity: DashboardActivityApiResponse[];
};

const dashboardDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const dashboardTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const dashboardRelativeTimeFormatter = new Intl.RelativeTimeFormat("en-US", {
  numeric: "auto",
});

function toSearchParams(
  params: Record<string, string | number | undefined>,
): URLSearchParams {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  return searchParams;
}

function withQuery(path: string, params: URLSearchParams): string {
  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const { data } = await axiosInstance.get<StudentDashboardApiResponse>(
    "/api/v1/student/dashboard",
  );

  return {
    currentUserName: data.current_user_name,
    stats: {
      upcomingSessions: data.stats.upcoming_sessions,
      pendingRequests: data.stats.pending_requests,
      completed: data.stats.completed,
      totalHours: data.stats.total_hours,
    },
    upcomingSessions: data.upcoming_sessions.map((session) =>
      mapStudentDashboardSession(session),
    ),
    recentActivity: data.recent_activity.map((activity) =>
      mapDashboardActivity(activity),
    ),
  };
}

export async function getAdviserDashboard(): Promise<AdviserDashboardData> {
  const { data } = await axiosInstance.get<AdviserDashboardApiResponse>(
    "/api/v1/adviser/dashboard",
  );

  return {
    currentUserName: data.current_user_name,
    stats: {
      pendingApprovals: data.stats.pending_approvals,
      todaysSessions: data.stats.todays_sessions,
      activeAdvisees: data.stats.active_advisees,
      thisMonth: data.stats.this_month,
    },
    upcomingSessions: data.upcoming_sessions.map((session) =>
      mapAdviserDashboardSession(session),
    ),
    recentActivity: data.recent_activity.map((activity) =>
      mapDashboardActivity(activity),
    ),
  };
}

export async function createSchedule(
  data: CreateScheduleRequest,
): Promise<Schedule> {
  const response = await axiosInstance.post<Schedule>("/api/schedules", data);
  return response.data;
}

export async function listSchedules(
  filters?: ListSchedulesFilters,
): Promise<ScheduleListResponse> {
  const path = withQuery(
    "/api/schedules",
    toSearchParams({
      status: filters?.status,
      type: filters?.type,
      from: filters?.from,
      to: filters?.to,
      page: filters?.page,
      limit: filters?.limit,
    }),
  );
  const response = await axiosInstance.get<ScheduleListResponse>(path);
  return response.data;
}

function mapStudentDashboardSession(
  session: DashboardSessionApiResponse,
): StudentDashboardData["upcomingSessions"][number] {
  const scheduledAt = new Date(session.scheduled_at);
  const endsAt = new Date(session.ends_at);

  return {
    id: session.id,
    title: session.title,
    adviserName: session.counterpart_name,
    date: dashboardDateFormatter.format(scheduledAt),
    startTime: dashboardTimeFormatter.format(scheduledAt),
    endTime: dashboardTimeFormatter.format(endsAt),
    status: normalizeDashboardSessionStatus(session.status_name),
    type: normalizeDashboardSessionType(session.type_name),
  };
}

function mapAdviserDashboardSession(
  session: DashboardSessionApiResponse,
): AdviserDashboardData["upcomingSessions"][number] {
  const scheduledAt = new Date(session.scheduled_at);
  const endsAt = new Date(session.ends_at);

  return {
    id: session.id,
    title: session.title,
    studentName: session.counterpart_name,
    date: dashboardDateFormatter.format(scheduledAt),
    startTime: dashboardTimeFormatter.format(scheduledAt),
    endTime: dashboardTimeFormatter.format(endsAt),
    status: normalizeDashboardSessionStatus(session.status_name),
    type: normalizeDashboardSessionType(session.type_name),
  };
}

function mapDashboardActivity(
  activity: DashboardActivityApiResponse,
): ActivityItem {
  const timestamp = formatDashboardRelativeTime(activity.created_at);

  return {
    id: activity.id,
    type: activity.activity_type,
    title: activity.title,
    description: `${activity.message} · ${timestamp}`,
    timestamp,
  };
}

function normalizeDashboardSessionStatus(statusName: string): SessionStatus {
  switch (statusName.trim().toLowerCase()) {
    case "approved":
      return "approved";
    case "cancelled":
      return "cancelled";
    case "rescheduled":
      return "rescheduled";
    default:
      return "pending";
  }
}

function normalizeDashboardSessionType(typeName: string): SessionType {
  return typeName.trim().toLowerCase() === "defense"
    ? "defense"
    : "consultation";
}

function formatDashboardRelativeTime(value: ISODateTimeString): string {
  const now = Date.now();
  const target = new Date(value).getTime();
  const deltaMs = target - now;

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Math.abs(deltaMs) < hour) {
    return dashboardRelativeTimeFormatter.format(
      Math.round(deltaMs / minute),
      "minute",
    );
  }

  if (Math.abs(deltaMs) < day) {
    return dashboardRelativeTimeFormatter.format(
      Math.round(deltaMs / hour),
      "hour",
    );
  }

  return dashboardRelativeTimeFormatter.format(
    Math.round(deltaMs / day),
    "day",
  );
}

export async function getSchedule(id: string): Promise<Schedule> {
  const response = await axiosInstance.get<Schedule>(`/api/schedules/${id}`);
  return response.data;
}

export async function cancelSchedule(id: string): Promise<Schedule> {
  const response = await axiosInstance.delete<Schedule>(`/api/schedules/${id}`);
  return response.data;
}

export async function approveSchedule(id: string): Promise<Schedule> {
  const response = await axiosInstance.put<Schedule>(
    `/api/schedules/${id}/approve`,
    {},
  );
  return response.data;
}

export async function rejectSchedule(
  id: string,
  remarks?: string,
): Promise<Schedule> {
  const payload: RejectScheduleRequest = {};

  if (remarks !== undefined) {
    payload.remarks = remarks;
  }

  const response = await axiosInstance.put<Schedule>(
    `/api/schedules/${id}/reject`,
    payload,
  );
  return response.data;
}

export async function rescheduleSchedule(
  id: string,
  new_scheduled_at: string,
  remarks?: string,
): Promise<Schedule> {
  const payload: RescheduleScheduleRequest = {
    scheduled_at: new_scheduled_at,
  };
  if (remarks !== undefined) {
    payload.remarks = remarks;
  }
  const response = await axiosInstance.put<Schedule>(
    `/api/schedules/${id}/reschedule`,
    payload,
  );
  return response.data;
}

export async function createSlot(
  data: CreateAvailabilitySlotRequest,
): Promise<AvailabilitySlot> {
  const response = await axiosInstance.post<AvailabilitySlot>(
    "/api/availability",
    data,
  );
  return response.data;
}

export async function listMySlots(): Promise<AvailabilitySlot[]> {
  const response =
    await axiosInstance.get<AvailabilitySlot[]>("/api/availability");
  return response.data;
}

export async function getFreeSlots(
  adviserId: string,
  date?: string,
): Promise<AvailabilitySlot[]> {
  const path = withQuery(
    `/api/availability/${adviserId}`,
    toSearchParams({ date }),
  );
  const response = await axiosInstance.get<AvailabilitySlot[]>(path);
  return response.data;
}

export async function toggleSlotBlocked(
  id: string,
  is_blocked: boolean,
): Promise<AvailabilitySlot> {
  const payload: UpdateAvailabilitySlotBlockedRequest = { is_blocked };
  const response = await axiosInstance.patch<AvailabilitySlot>(
    `/api/availability/${id}`,
    payload,
  );
  return response.data;
}

export async function deleteSlot(id: string): Promise<void> {
  await axiosInstance.delete(`/api/availability/${id}`);
}

export async function listNotifications(
  params?: ListNotificationsParams,
): Promise<NotificationListResponse> {
  const path = withQuery(
    "/api/notifications",
    toSearchParams({
      limit: params?.limit,
      offset: params?.offset,
    }),
  );
  const response = await axiosInstance.get<NotificationListResponse>(path);
  return response.data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const response = await axiosInstance.patch<Notification>(
    `/api/notifications/${id}/read`,
  );
  return response.data;
}

export async function markAllNotificationsRead(): Promise<MarkAllNotificationsReadResult> {
  const response = await axiosInstance.patch<MarkAllNotificationsReadResult>(
    "/api/notifications/read-all",
  );
  return response.data;
}

export async function listAdvisers(): Promise<AdviserDirectoryUser[]> {
  const response = await axiosInstance.get<AdviserDirectoryUser[]>(
    "/api/users/advisers",
  );
  return response.data;
}
