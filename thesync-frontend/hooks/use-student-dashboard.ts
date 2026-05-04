"use client";

import { useEffect, useState } from "react";
import type { StudentDashboardData } from "@/types/dashboard";

const MOCK_DATA: StudentDashboardData = {
  stats: {
    upcomingSessions: 3,
    pendingRequests: 1,
    completed: 12,
    totalHours: 24,
  },
  upcomingSessions: [
    {
      id: "1",
      title: "Chapter 1 Review",
      adviserName: "Dr. Proceso L. Fernandez",
      date: "May 5, 2026",
      startTime: "2:00 PM",
      endTime: "3:00 PM",
      status: "approved",
      type: "consultation",
    },
    {
      id: "2",
      title: "Methodology Discussion",
      adviserName: "Dr. Jasmine A. Malin",
      date: "May 8, 2026",
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      status: "pending",
      type: "consultation",
    },
    {
      id: "3",
      title: "Thesis Defense",
      adviserName: "Dr. Lemuel Clark P. Velasco",
      date: "May 15, 2026",
      startTime: "1:00 PM",
      endTime: "3:00 PM",
      status: "approved",
      type: "defense",
    },
  ],
  recentActivity: [
    {
      id: "1",
      type: "approved",
      title: "Request Approved",
      description: "Chapter 1 Review · 2 hours ago",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "notification",
      title: "New Notification",
      description: "Reminder: Session tomorrow · 5 hours ago",
      timestamp: "5 hours ago",
    },
    {
      id: "3",
      type: "completed",
      title: "Session Completed",
      description: "Literature Review · Yesterday",
      timestamp: "Yesterday",
    },
  ],
};

export interface UseStudentDashboardResult {
  data: StudentDashboardData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useStudentDashboard(): UseStudentDashboardResult {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Replace with: studentApi.getDashboard() once the backend is ready
    setData(MOCK_DATA);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error };
}
