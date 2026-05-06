import type { UserResponse } from "@/types/user";

export type InviteStatusEnum = "invited" | "accepted" | "declined";

export interface PanelistAssignmentResponse {
  id: string;
  schedule_id: string;
  panelist: UserResponse;
  invite_status: InviteStatusEnum;
}
