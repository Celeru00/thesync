export type ConsultationStatus =
  | "approved"
  | "pending"
  | "completed"
  | "rejected";

export type ConsultationCategory = "Consultation" | "Defense";

export interface Consultation {
  id: string;
  title: string;
  description: string;
  category: ConsultationCategory;
  status: ConsultationStatus;
  adviser: string;
  adviserId: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  meetLink?: string;
  location?: string;
}
