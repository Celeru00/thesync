import type { UserResponse } from "@/types/user";

export interface AuditLogResponse {
  id: string;
  changed_by: UserResponse;
  previous_status?: string | null;
  new_status: string;
  remarks?: string | null;
  changed_at: string;
}
