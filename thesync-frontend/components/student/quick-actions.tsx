import { Calendar, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button asChild className="w-full justify-start gap-2">
          <Link href="/student/consultations">
            <Calendar className="size-4" />
            Request Consultation
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Link href="/student/calendar">
            <Clock className="size-4" />
            View Calendar
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
