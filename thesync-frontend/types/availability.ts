/** Payload for creating a recurring adviser availability rule */
export interface AvailabilitySlotCreateRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_blocked?: boolean;
}

/** Payload for toggling whether an availability rule is blocked */
export interface AvailabilitySlotPatchRequest {
  is_blocked: boolean;
}

/** Availability rule returned by the adviser management API */
export interface AvailabilitySlotResponse {
  id: string;
  adviser_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
}

/** Concrete bookable slot returned for a selected date */
export interface AvailabilityConcreteSlotResponse {
  id: string;
  adviser_id: string;
  slot_start: string;
  slot_end: string;
  is_blocked: boolean;
  source_rule_id?: string | null;
}

/** Alias for AvailabilityConcreteSlotResponse */
export type AvailabilitySlot = AvailabilityConcreteSlotResponse;

/** Alias for AvailabilitySlotPatchRequest */
export type AvailabilitySlotBlockedUpdateRequest = AvailabilitySlotPatchRequest;
