export type ConsultationRequestType = "consultation" | "defense";
export type ConsultationRequestStatus =
  | "approved"
  | "pending"
  | "completed"
  | "rejected";
export type AdviserAvailability = "High" | "Medium" | "Limited";
export type TimePeriod = "morning" | "afternoon" | "all-day";

export type AdviserProfile = {
  id: string;
  name: string;
  department: string;
  departmentCode: string;
  availability: AdviserAvailability;
  email: string;
  expertise: string[];
  availableSlots: string[];
};

export type StudentConsultationRecord = {
  id: string;
  title: string;
  summary: string;
  adviserId: string;
  date: string;
  timeLabel: string;
  type: ConsultationRequestType;
  status: ConsultationRequestStatus;
};

export type TimeSlotDefinition = {
  id: string;
  label: string;
  period: Exclude<TimePeriod, "all-day">;
};

export const studentAdvisers: AdviserProfile[] = [
  {
    id: "proceso-fernandez",
    name: "Dr. Proceso L. Fernandez",
    department: "Department of Mathematics, Physics, and Computer Science",
    departmentCode: "DMPCS",
    availability: "High",
    email: "proceso.fernandez@up.edu.ph",
    expertise: ["Research design", "Systems analysis", "Data validation"],
    availableSlots: [
      "08:00",
      "08:30",
      "09:30",
      "10:00",
      "11:00",
      "11:30",
      "13:00",
      "13:30",
      "14:00",
      "15:00",
      "15:30",
      "16:30",
      "17:00",
    ],
  },
  {
    id: "jasmine-malin",
    name: "Dr. Jasmine A. Malin",
    department: "Department of Mathematics, Physics, and Computer Science",
    departmentCode: "DMPCS",
    availability: "Medium",
    email: "jasmine.malin@up.edu.ph",
    expertise: ["Applied statistics", "Evaluation methods", "Data analysis"],
    availableSlots: [
      "08:00",
      "08:30",
      "10:00",
      "11:00",
      "11:30",
      "13:00",
      "13:30",
      "14:00",
      "15:00",
      "15:30",
      "16:30",
      "17:00",
    ],
  },
  {
    id: "lemuel-velasco",
    name: "Dr. Lemuel Clark P. Velasco",
    department: "Department of Mathematics, Physics, and Computer Science",
    departmentCode: "DMPCS",
    availability: "High",
    email: "lemuel.velasco@up.edu.ph",
    expertise: ["Defense coordination", "Software quality", "Architecture"],
    availableSlots: [
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "11:00",
      "11:30",
      "13:00",
      "14:00",
      "15:30",
      "16:30",
      "17:00",
    ],
  },
  {
    id: "maria-beltran",
    name: "Dr. Maria Isabelle Carla G. Beltran",
    department: "Department of Food Science and Chemistry",
    departmentCode: "DFSC",
    availability: "Medium",
    email: "maria.beltran@up.edu.ph",
    expertise: ["Proposal review", "Research presentation", "Committee work"],
    availableSlots: [
      "08:00",
      "08:30",
      "09:30",
      "10:00",
      "11:00",
      "11:30",
      "13:30",
      "14:00",
      "15:00",
      "15:30",
      "16:30",
      "17:00",
    ],
  },
  {
    id: "richard-chua",
    name: "Dr. Richard Bryann L. Chua",
    department: "Department of Biological Sciences and Environmental Studies",
    departmentCode: "DBSES",
    availability: "Limited",
    email: "richard.chua@up.edu.ph",
    expertise: ["Defense panel", "Research ethics", "Study validation"],
    availableSlots: [
      "08:30",
      "09:30",
      "10:00",
      "11:30",
      "13:00",
      "14:00",
      "15:30",
      "16:30",
    ],
  },
];

export const studentConsultationRecords: StudentConsultationRecord[] = [
  {
    id: "chapter-1-review",
    title: "Chapter 1 Review",
    summary: "Introduction and Background",
    adviserId: "proceso-fernandez",
    date: "2026-05-05",
    timeLabel: "2:00 PM - 3:00 PM",
    type: "consultation",
    status: "approved",
  },
  {
    id: "methodology-discussion",
    title: "Methodology Discussion",
    summary: "Research Design and Methods",
    adviserId: "jasmine-malin",
    date: "2026-05-08",
    timeLabel: "10:00 AM - 11:00 AM",
    type: "consultation",
    status: "pending",
  },
  {
    id: "literature-review-feedback",
    title: "Literature Review Feedback",
    summary: "Related Studies and Theoretical Framework",
    adviserId: "proceso-fernandez",
    date: "2026-04-28",
    timeLabel: "3:00 PM - 4:00 PM",
    type: "consultation",
    status: "completed",
  },
  {
    id: "thesis-defense",
    title: "Thesis Defense",
    summary: "Final Defense Presentation",
    adviserId: "lemuel-velasco",
    date: "2026-05-15",
    timeLabel: "1:00 PM - 3:00 PM",
    type: "defense",
    status: "approved",
  },
  {
    id: "data-analysis-review",
    title: "Data Analysis Review",
    summary: "Statistical Analysis Methods",
    adviserId: "jasmine-malin",
    date: "2026-05-03",
    timeLabel: "11:00 AM - 12:00 PM",
    type: "consultation",
    status: "rejected",
  },
];

export const requestTimeSlots: TimeSlotDefinition[] = [
  { id: "08:00", label: "8:00 AM", period: "morning" },
  { id: "08:30", label: "8:30 AM", period: "morning" },
  { id: "09:00", label: "9:00 AM", period: "morning" },
  { id: "09:30", label: "9:30 AM", period: "morning" },
  { id: "10:00", label: "10:00 AM", period: "morning" },
  { id: "10:30", label: "10:30 AM", period: "morning" },
  { id: "11:00", label: "11:00 AM", period: "morning" },
  { id: "11:30", label: "11:30 AM", period: "morning" },
  { id: "13:00", label: "1:00 PM", period: "afternoon" },
  { id: "13:30", label: "1:30 PM", period: "afternoon" },
  { id: "14:00", label: "2:00 PM", period: "afternoon" },
  { id: "14:30", label: "2:30 PM", period: "afternoon" },
  { id: "15:00", label: "3:00 PM", period: "afternoon" },
  { id: "15:30", label: "3:30 PM", period: "afternoon" },
  { id: "16:00", label: "4:00 PM", period: "afternoon" },
  { id: "16:30", label: "4:30 PM", period: "afternoon" },
  { id: "17:00", label: "5:00 PM", period: "afternoon" },
];

export const requestNotes = [
  "Your adviser will review and respond to your request within 24-48 hours.",
  "Email notifications will be sent to your UP email for all status updates.",
  "You'll also receive in-app notifications about your consultation.",
  "The consultation will be added to your calendar upon approval.",
];
