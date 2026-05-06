import type { StudentDashboardData } from "@/types/dashboard";

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
  created_at: ISODateTimeString;
};

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
  const { data } = await axiosInstance.get<StudentDashboardData>(
    "/api/v1/student/dashboard",
  );

  return data;
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
