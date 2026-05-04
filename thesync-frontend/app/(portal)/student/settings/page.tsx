import {
  Bell,
  CalendarDays,
  Camera,
  CircleUserRound,
  LockKeyhole,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const notificationPreferences = [
  {
    id: "email-notifications",
    title: "Email Notifications",
    description: "Receive email updates about your consultations",
  },
  {
    id: "request-approvals",
    title: "Request Approvals",
    description: "Get notified when requests are approved or rejected",
  },
  {
    id: "session-reminders",
    title: "Session Reminders",
    description: "Receive reminders before scheduled sessions",
  },
  {
    id: "reschedule-notifications",
    title: "Reschedule Notifications",
    description: "Be notified when sessions are rescheduled",
  },
];

const accountDetails = [
  { label: "Account Type", value: "Student" },
  { label: "Member Since", value: "April 2026" },
  { label: "Last Login", value: "May 1, 2026" },
];

export default function StudentSettingsPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Settings</h1>
        <p className="text-body text-content-muted">
          Manage your account and application preferences
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <UserRound className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription className="text-base">
                    Update your personal information and profile details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6">
              <form className="space-y-6">
                <div className="flex flex-col gap-4 rounded-lg border border-dashed border-control bg-surface-muted-soft p-4 sm:flex-row sm:items-center">
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <CircleUserRound className="size-10" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-label">Profile Photo</p>
                    <p className="mt-1 text-body-sm text-content-muted">
                      Upload a square photo for your student profile.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg"
                  >
                    <Camera data-icon="inline-start" className="size-4" />
                    Upload Avatar
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" defaultValue="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john.doe@upm.edu"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student-id">Student/Employee ID</Label>
                  <Input id="student-id" defaultValue="2020-12345" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select defaultValue="dmpcs">
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dmpcs">
                        Department of Mathematics, Physics, and Computer Science
                        (DMPCS)
                      </SelectItem>
                      <SelectItem value="cas">
                        Department of Food Science and Chemistry (DFSC)
                      </SelectItem>
                      <SelectItem value="cp">
                        Department of Biological Sciences and Environmental
                        Studies (DBSES)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="button" className="rounded-lg">
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <Bell className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription className="text-base">
                    Choose how you want to receive notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6">
              <div className="divide-y divide-border">
                {notificationPreferences.map((preference) => (
                  <div
                    key={preference.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0"
                  >
                    <div className="min-w-0">
                      <Label htmlFor={preference.id}>{preference.title}</Label>
                      <p className="mt-1 text-body-sm text-content-muted">
                        {preference.description}
                      </p>
                    </div>
                    <Switch id={preference.id} defaultChecked />
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="reminder-time">Reminder Time</Label>
                <Select defaultValue="1-hour">
                  <SelectTrigger id="reminder-time">
                    <SelectValue placeholder="Select reminder time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-minutes">
                      15 minutes before
                    </SelectItem>
                    <SelectItem value="30-minutes">
                      30 minutes before
                    </SelectItem>
                    <SelectItem value="1-hour">1 hour before</SelectItem>
                    <SelectItem value="1-day">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Calendar Integration</CardTitle>
                  <CardDescription className="text-base">
                    Manage your Google Calendar connection
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              <div className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <CalendarDays className="size-5" />
                  </div>
                  <div>
                    <p className="text-label">Connected to Google Calendar</p>
                    <p className="text-body-sm text-content-muted">
                      john.doe@upm.edu
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" className="rounded-lg">
                  Disconnect
                </Button>
              </div>

              <div className="divide-y divide-border">
                <div className="flex items-center justify-between gap-4 py-4 first:pt-0">
                  <div>
                    <Label htmlFor="auto-sync">Auto-sync Events</Label>
                    <p className="mt-1 text-body-sm text-content-muted">
                      Automatically add approved consultations to your calendar
                    </p>
                  </div>
                  <Switch id="auto-sync" defaultChecked />
                </div>

                <div className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <Label htmlFor="meet-links">
                      Include Google Meet Links
                    </Label>
                    <p className="mt-1 text-body-sm text-content-muted">
                      Generate meeting links for online consultations
                    </p>
                  </div>
                  <Switch id="meet-links" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-center gap-3">
                <LockKeyhole className="size-5 shrink-0 text-content-strong" />
                <CardTitle>Security</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg"
              >
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              <dl className="divide-y divide-border">
                {accountDetails.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0"
                  >
                    <dt className="text-body-sm text-content-muted">
                      {detail.label}
                    </dt>
                    <dd className="text-sm font-medium text-content-strong">
                      {detail.value}
                    </dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-4 pt-3">
                  <dt className="text-body-sm text-content-muted">Status</dt>
                  <dd>
                    <Badge variant="success" className="h-6 px-3">
                      Active
                    </Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <p className="text-body-sm text-content-muted">
                Once you delete your account, all your data will be permanently
                removed and cannot be recovered.
              </p>
              <Button
                type="button"
                variant="destructive"
                className="w-full rounded-lg"
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
