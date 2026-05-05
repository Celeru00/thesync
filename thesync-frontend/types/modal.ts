export type ConsultationType =
  | "Regular"
  | "Proposal Defense"
  | "Final Defense"
  | "Revision";

export type ConfirmationVariant = "destructive" | "success" | "warning";

export interface ScheduleParticipant {
  id: string;
  name: string;
  role: "Adviser" | "Student" | "Panelist";
  email?: string;
}

export interface ScheduleDetail {
  id: string;
  title: string;
  type: ConsultationType;
  status: "approved" | "pending" | "completed" | "rejected" | "cancelled";
  date: string;
  startTime: string;
  endTime: string;
  participants: ScheduleParticipant[];
  topic: string;
  description: string;
  location?: string;
  meetLink?: string;
}

export interface AdviserOption {
  id: string;
  name: string;
  department: string;
}

export interface ConsultationFormValues {
  type: ConsultationType;
  adviserId: string;
  topic: string;
  description: string;
  date?: string;
  startTime?: string;
  endTime?: string;
}
