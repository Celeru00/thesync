import type { UserResponse } from "@/types/user";
export type { InviteStatus as InviteStatusEnum } from "@/types/status";

/** Payload for assigning a panelist to a schedule */
export interface PanelistAssignmentCreateRequest {
  panelist_id: string;
}

/** Payload for a panelist responding to an invite */
export interface PanelistRespondRequest {
  response: "invited" | "accepted" | "declined";
}

/** Assignment of a panelist to a schedule at the data/domain layer */
export interface PanelistAssignment {
  id: string;
  schedule_id: string;
  panelist_id: string;
  invite_status_id: number;
}

/** Expanded panelist assignment returned by the API */
export interface PanelistAssignmentResponse {
  id: string;
  schedule_id: string;
  panelist: UserResponse;
  invite_status: "invited" | "accepted" | "declined";
}

/** Alias for PanelistRespondRequest */
export type PanelistInviteResponseRequest = PanelistRespondRequest;
