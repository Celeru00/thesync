/** Notification types for UI display and icon determination */
export type NotificationType =
  | "approved"
  | "reminder"
  | "reschedule"
  | "completed"
  | "info";

/** User-facing notification emitted by schedule events */
export interface Notification {
  id: string;
  user_id: string;
  schedule_id?: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
  /** UI type for icon/styling — inferred from message or set by backend */
  type?: NotificationType;
  /** UI title for display — derived from message or set explicitly */
  title?: string;
}

/** Notification response shape returned by the API */
export type NotificationResponse = Notification;

/** Paginated notification response including unread totals */
export interface NotificationListResponse {
  items: NotificationResponse[];
  total: number;
  page: number;
  page_size: number;
  total_unread: number;
}
