export type SessionStatus =
  | "approved"
  | "pending"
  | "cancelled"
  | "rescheduled";
export type SessionType = "consultation" | "defense";
export type ActivityType = "approved" | "notification" | "completed";

export interface UpcomingSession {
  id: string;
  title: string;
  adviserName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  type: SessionType;
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  upcomingSessions: number;
  pendingRequests: number;
  completed: number;
  totalHours: number;
}

export interface StudentDashboardData {
  currentUserName: string;
  stats: DashboardStats;
  upcomingSessions: UpcomingSession[];
  recentActivity: ActivityItem[];
}

export interface AdviserUpcomingSession {
  id: string;
  title: string;
  studentName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: SessionStatus;
  type: SessionType;
}

export interface AdviserDashboardStats {
  pendingApprovals: number;
  todaysSessions: number;
  activeAdvisees: number;
  thisMonth: number;
}

export interface AdviserDashboardData {
  currentUserName: string;
  stats: AdviserDashboardStats;
  upcomingSessions: AdviserUpcomingSession[];
  recentActivity: ActivityItem[];
}
