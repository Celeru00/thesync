/** Payload for creating an adviser availability slot */
export interface AvailabilitySlotCreateRequest {
  slot_start: string;
  slot_end: string;
  is_blocked?: boolean;
}

/** Payload for toggling whether an availability slot is blocked */
export interface AvailabilitySlotPatchRequest {
  is_blocked: boolean;
}

/** Availability slot returned by the API and repositories */
export interface AvailabilitySlotResponse {
  id: string;
  adviser_id: string;
  slot_start: string;
  slot_end: string;
  is_blocked: boolean;
}

/** Alias for AvailabilitySlotResponse */
export type AvailabilitySlot = AvailabilitySlotResponse;

/** Alias for AvailabilitySlotPatchRequest */
export type AvailabilitySlotBlockedUpdateRequest = AvailabilitySlotPatchRequest;
