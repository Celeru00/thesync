import { CalendarDays, Clock3, Plus, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const availabilitySlots = [
  { day: "Monday", start: "9:00 AM", end: "12:00 PM" },
  { day: "Monday", start: "2:00 PM", end: "5:00 PM" },
  { day: "Tuesday", start: "9:00 AM", end: "12:00 PM" },
  { day: "Wednesday", start: "2:00 PM", end: "5:00 PM" },
  { day: "Friday", start: "10:00 AM", end: "12:00 PM" },
];

const previewRows = [
  { day: "Monday", value: "2 slot(s)" },
  { day: "Tuesday", value: "1 slot(s)" },
  { day: "Wednesday", value: "1 slot(s)" },
  { day: "Thursday", value: "Unavailable" },
  { day: "Friday", value: "1 slot(s)" },
  { day: "Saturday", value: "Unavailable" },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const times = [
  "9:00 AM",
  "10:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "5:00 PM",
];

export default function AdviserAvailabilityPage() {
  return (
    <div className="flex flex-col gap-7">
      <header className="space-y-2">
        <h1 className="text-heading">Availability Settings</h1>
        <p className="text-body text-content-muted">
          Manage your consultation availability and preferences
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="gap-2 px-6">
              <div className="flex items-start gap-3">
                <Clock3 className="mt-1 size-5 shrink-0 text-content-strong" />
                <div>
                  <CardTitle>Weekly Availability</CardTitle>
                  <CardDescription className="text-base">
                    Set your available time slots for consultations
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6">
              {availabilitySlots.map((slot, index) => (
                <div
                  key={`${slot.day}-${slot.start}`}
                  className="grid gap-3 rounded-lg border border-control p-4 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center"
                >
                  <Switch
                    id={`slot-${index}`}
                    defaultChecked
                    aria-label={`Enable ${slot.day} ${slot.start} availability`}
                  />
                  <Select defaultValue={slot.day}>
                    <SelectTrigger aria-label="Day">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select defaultValue={slot.start}>
                    <SelectTrigger aria-label="Start time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {times.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select defaultValue={slot.end}>
                    <SelectTrigger aria-label="End time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {times.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="justify-self-start rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 md:justify-self-end"
                    aria-label="Remove time slot"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-lg border-dashed bg-surface-muted-soft"
              >
                <Plus data-icon="inline-start" className="size-4" />
                Add Time Slot
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Consultation Preferences</CardTitle>
              <CardDescription className="text-base">
                Configure how consultations are managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label htmlFor="auto-approve">Auto-approve Requests</Label>
                  <p className="mt-1 text-body-sm text-content-muted">
                    Automatically approve requests during available time slots
                  </p>
                </div>
                <Switch id="auto-approve" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buffer-time">
                  Buffer Time Between Consultations
                </Label>
                <Select defaultValue="15">
                  <SelectTrigger id="buffer-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-content-muted">
                  Time reserved between consecutive consultations
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximum-consultations">
                  Maximum Consultations Per Day
                </Label>
                <Select defaultValue="5">
                  <SelectTrigger id="maximum-consultations">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 consultations</SelectItem>
                    <SelectItem value="5">5 consultations</SelectItem>
                    <SelectItem value="8">8 consultations</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-content-muted">
                  Limit the number of consultations you can have in a single day
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card className="rounded-xl py-6 shadow-elevated">
            <CardHeader className="px-6">
              <CardTitle>Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6">
              <div>
                <p className="text-body-sm text-content-muted">
                  Active Time Slots
                </p>
                <p className="mt-1 text-2xl font-semibold text-brand">5</p>
              </div>
              <div>
                <p className="text-body-sm text-content-muted">
                  Total Hours/Week
                </p>
                <p className="mt-1 text-2xl font-semibold text-brand">
                  ~15 hrs
                </p>
              </div>
              <div>
                <p className="text-body-sm text-content-muted">Auto-approve</p>
                <p className="mt-1 text-sm font-medium text-content-strong">
                  Disabled
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-blue-100 bg-blue-50 py-6 text-blue-900 shadow-elevated">
            <CardHeader className="px-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="size-5" />
                <CardTitle className="text-blue-900">Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <p className="text-sm font-medium text-blue-800">
                Your availability this week:
              </p>
              <div className="space-y-2 text-sm text-blue-800">
                {previewRows.map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center justify-between gap-4"
                  >
                    <span>{row.day}:</span>
                    <span className="font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button type="button" className="w-full rounded-lg">
            <Save data-icon="inline-start" className="size-4" />
            Save Changes
          </Button>
        </aside>
      </div>
    </div>
  );
}
