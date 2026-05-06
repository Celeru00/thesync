export type NotificationType =
  | "approved"
  | "reminder"
  | "reschedule"
  | "completed"
  | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  /** ISO 8601 date string — used for relative time display and sorting */
  timestamp: string;
  read: boolean;
  /** ID of the related consultation for deep linking */
  relatedConsultationId?: string;
}

export interface NotificationResponse {
  id: string;
  user_id: string;
  schedule_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  page_size: number;
  total_unread: number;
}
