import type { ReactNode } from "react";

import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Filter,
  Info,
  LayoutDashboard,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Settings2,
  TriangleAlert,
  UserRound,
  Video,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sidebar, type SidebarItem } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type NavItem = {
  href: string;
  label: string;
};

type Swatch = {
  name: string;
  value: string;
  usage: string;
  className: string;
  dark?: boolean;
};

type TypeScale = {
  name: string;
  sample: string;
  token: string;
  usage: string;
  className: string;
};

type IconTile = {
  label: string;
  icon: LucideIcon;
};

const navigation: NavItem[] = [
  { href: "#brand", label: "Brand" },
  { href: "#colors", label: "Colors" },
  { href: "#typography", label: "Typography" },
  { href: "#buttons", label: "Buttons" },
  { href: "#forms", label: "Forms" },
  { href: "#badges", label: "Badges" },
  { href: "#cards", label: "Cards" },
  { href: "#alerts", label: "Alerts" },
  { href: "#layout", label: "Layout" },
  { href: "#guidelines", label: "Guidelines" },
];

const categoryCards = [
  {
    title: "Foundation",
    items: ["Colors", "Typography", "Spacing", "Elevation"],
  },
  {
    title: "Components",
    items: ["Buttons", "Forms", "Cards", "Alerts"],
  },
  {
    title: "Patterns",
    items: ["Grid", "Responsive rules", "Accessibility", "Status states"],
  },
];

const primarySwatches: Swatch[] = [
  {
    name: "Primary Blue",
    value: "#2563EB",
    usage: "Primary CTA and active state",
    className: "bg-primary",
    dark: true,
  },
  {
    name: "Primary Dark",
    value: "#1E40AF",
    usage: "Hover and stronger emphasis",
    className: "bg-primary-dark",
    dark: true,
  },
  {
    name: "Primary Light",
    value: "#3B82F6",
    usage: "Secondary highlights",
    className: "bg-primary-light",
    dark: true,
  },
  {
    name: "Primary Tint",
    value: "#EFF6FF",
    usage: "Background tint and surfaces",
    className: "bg-primary-tint",
  },
];

const statusSwatches: Swatch[] = [
  {
    name: "Success / Approved",
    value: "#10B981",
    usage: "Positive status and confirmations",
    className: "bg-success",
    dark: true,
  },
  {
    name: "Warning / Pending",
    value: "#F59E0B",
    usage: "Pending actions and reminders",
    className: "bg-warning",
    dark: true,
  },
  {
    name: "Error / Rejected",
    value: "#EF4444",
    usage: "Errors and destructive actions",
    className: "bg-destructive",
    dark: true,
  },
  {
    name: "Info / Defense",
    value: "#0EA5E9",
    usage: "Helpful information and notices",
    className: "bg-info",
    dark: true,
  },
  {
    name: "Special / Schedule",
    value: "#8B5CF6",
    usage: "Special events and standout labels",
    className: "bg-violet",
    dark: true,
  },
];

const grayscaleSwatches: Swatch[] = [
  {
    name: "Gray 900",
    value: "#111827",
    usage: "Headings and primary text",
    className: "bg-gray-900",
    dark: true,
  },
  {
    name: "Gray 700",
    value: "#374151",
    usage: "Body copy",
    className: "bg-gray-700",
    dark: true,
  },
  {
    name: "Gray 600",
    value: "#4B5563",
    usage: "Supportive text",
    className: "bg-gray-600",
    dark: true,
  },
  {
    name: "Gray 400",
    value: "#9CA3AF",
    usage: "Metadata and placeholder text",
    className: "bg-gray-400",
  },
  {
    name: "Gray 200",
    value: "#E5E7EB",
    usage: "Borders and dividers",
    className: "bg-gray-200",
  },
  {
    name: "Background",
    value: "#FBFCFF",
    usage: "Page shell and panels",
    className: "bg-background",
  },
];

const typeScale: TypeScale[] = [
  {
    name: "Heading 1",
    sample: "Defense scheduling overview",
    token: "text-heading",
    usage: "Primary page titles",
    className: "text-heading",
  },
  {
    name: "Heading 2",
    sample: "Upcoming consultations",
    token: "text-subheading",
    usage: "Section headings",
    className: "text-subheading",
  },
  {
    name: "Heading 3",
    sample: "Panel assignment",
    token: "text-section-title",
    usage: "Card titles and group headings",
    className: "text-section-title",
  },
  {
    name: "Heading 4",
    sample: "Consultation details",
    token: "text-card-title",
    usage: "Compact headings",
    className: "text-card-title",
  },
  {
    name: "Body Text",
    sample:
      "ThesisSync centralizes scheduling, approvals, and communication for consultations and defenses.",
    token: "text-body",
    usage: "Paragraphs and dense interface copy",
    className: "text-body",
  },
  {
    name: "Small Text",
    sample: "Used for helper text, metadata, and minor UI labels.",
    token: "text-body-sm",
    usage: "Secondary information",
    className: "text-body-sm",
  },
  {
    name: "Extra Small Text",
    sample: "Schedule last synced 2 minutes ago",
    token: "text-caption",
    usage: "Captions and metadata",
    className: "text-caption",
  },
];

const iconTiles: IconTile[] = [
  { label: "Calendar", icon: CalendarDays },
  { label: "Clock", icon: Clock3 },
  { label: "User", icon: UserRound },
  { label: "Check", icon: CheckCircle2 },
  { label: "Alert", icon: TriangleAlert },
  { label: "Close", icon: XCircle },
  { label: "File", icon: FileText },
  { label: "Mail", icon: Mail },
  { label: "Phone", icon: Phone },
  { label: "Video", icon: Video },
  { label: "Location", icon: MapPin },
  { label: "Settings", icon: Settings2 },
  { label: "Bell", icon: Bell },
  { label: "Chevron", icon: ChevronRight },
  { label: "Plus", icon: Plus },
  { label: "Arrow", icon: ArrowRight },
  { label: "Search", icon: Search },
  { label: "Filter", icon: Filter },
];

const spacingScale = [
  { token: "1", value: "0.25rem (4px)", width: "w-1", note: "Minimal spacing" },
  { token: "2", value: "0.5rem (8px)", width: "w-2", note: "Tight grouping" },
  {
    token: "3",
    value: "0.75rem (12px)",
    width: "w-3",
    note: "Compact spacing",
  },
  { token: "4", value: "1rem (16px)", width: "w-4", note: "Default spacing" },
  { token: "6", value: "1.5rem (24px)", width: "w-6", note: "Section spacing" },
  {
    token: "8",
    value: "2rem (32px)",
    width: "w-8",
    note: "Large visual separation",
  },
  {
    token: "12",
    value: "3rem (48px)",
    width: "w-12",
    note: "Major layout spacing",
  },
  {
    token: "16",
    value: "4rem (64px)",
    width: "w-16",
    note: "Maximum intentional space",
  },
];

const breakpoints = [
  {
    name: "Mobile",
    range: "< 640px",
    prefix: "Default",
    note: "Single-column layouts and stacked actions.",
  },
  {
    name: "SM",
    range: "≥ 640px",
    prefix: "sm:",
    note: "Large phones and compact tablets.",
  },
  {
    name: "MD",
    range: "≥ 768px",
    prefix: "md:",
    note: "Tablets and small laptops.",
  },
  {
    name: "LG",
    range: "≥ 1024px",
    prefix: "lg:",
    note: "Desktop scheduling workspaces.",
  },
  {
    name: "XL",
    range: "≥ 1280px",
    prefix: "xl:",
    note: "Wide desktop dashboards.",
  },
];

const sidebarItems: SidebarItem[] = [
  { href: "#dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "#calendar", label: "Calendar", icon: CalendarDays },
  { href: "#consultations", label: "Consultations", icon: FileText },
  { href: "#notifications", label: "Notifications", icon: Bell },
  { href: "#settings", label: "Settings", icon: Settings2 },
];

const sidebarUser = {
  name: "John Doe",
  email: "john.doe@upm.edu",
  initials: "JD",
};

const guidelineGroups = [
  {
    title: "Buttons",
    points: [
      "Use primary buttons for submit, create, and confirm flows.",
      "Reserve outline buttons for cancel, back, and low-emphasis actions.",
      "Pair icons with high-frequency actions where scan speed matters.",
      "Disable buttons during loading or incomplete form states.",
    ],
  },
  {
    title: "Forms",
    points: [
      "Always pair inputs with labels and clear helper text.",
      "Show validation inline, directly beneath the control.",
      "Keep placeholder text descriptive but brief.",
      "Use switches only for immediate boolean settings.",
    ],
  },
  {
    title: "Colors",
    points: [
      "Use brand blue for the main action and active navigation states.",
      "Apply status colors consistently across badges, alerts, and cards.",
      "Preserve a 4.5:1 contrast ratio for standard copy.",
      "Use tinted backgrounds sparingly to signal grouped importance.",
    ],
  },
  {
    title: "Spacing",
    points: [
      "Use `space-y-6` between major sections inside a panel.",
      "Use `space-y-4` for related content blocks within a section.",
      "Use `space-y-2` for labels, controls, and helper text.",
      "Use `gap-4` or `gap-6` for card and stats grids.",
    ],
  },
];

const accessibilityCards = [
  {
    title: "Color Contrast",
    description:
      "All text should meet WCAG AA contrast thresholds for body and large display text.",
    icon: CheckCircle2,
    tone: "text-card-success bg-card-success border-card-success",
  },
  {
    title: "Keyboard Navigation",
    description:
      "Interactive controls keep visible focus rings and logical tab order.",
    icon: ArrowRight,
    tone: "text-card-info bg-card-info border-card-info",
  },
  {
    title: "Screen Readers",
    description:
      "Use semantic HTML, associated labels, and explicit descriptions for complex controls.",
    icon: Info,
    tone: "text-alert-info bg-alert-info border-alert-info",
  },
  {
    title: "Responsive Design",
    description:
      "Mobile-first layout rules keep scheduling flows readable at every breakpoint.",
    icon: CalendarDays,
    tone: "text-badge-special bg-badge-special border-badge-special",
  },
];

export function DesignSystemShowcase() {
  return (
    <main className="min-h-screen bg-page text-page">
      <header className="border-b border-surface bg-linear-to-b from-primary-tint via-background to-background">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge variant="secondary">ThesisSync Design System</Badge>
                <div className="space-y-3">
                  <h1 className="text-heading">
                    Shared visual rules for scheduling, consultation, and
                    defense workflows.
                  </h1>
                  <p className="max-w-2xl text-body">
                    The system is built around Poppins, brand-first blues,
                    restrained surfaces, and consistent shadcn primitives tuned
                    for university operations rather than marketing screens.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:w-[480px]">
                {categoryCards.map((card) => (
                  <Card
                    key={card.title}
                    className="border-brand-subtle bg-surface-frosted backdrop-blur-sm"
                    size="sm"
                  >
                    <CardHeader className="pb-1">
                      <CardTitle className="text-label">{card.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1 text-body-sm">
                        {card.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {navigation.map((item) => (
                <Button key={item.href} asChild size="sm" variant="outline">
                  <a href={item.href}>{item.label}</a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <SectionShell
          id="brand"
          eyebrow="Brand Identity"
          title="Core brand elements"
          description="The visual language emphasizes clarity, reliability, and academic coordination."
        >
          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card className="border-brand-subtle shadow-elevated">
              <CardContent className="px-6 py-6">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-brand text-brand-on shadow-glow">
                    <CalendarDays className="size-8" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-eyebrow">Logo & Name</div>
                    <div className="text-subheading">ThesisSync</div>
                    <p className="max-w-xl text-body">
                      A centralized scheduling system for thesis consultations
                      and defense coordination across the UP Mindanao academic
                      community.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience</CardTitle>
                <CardDescription>
                  Primary users expected to move through high-frequency admin
                  tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Students preparing proposals and final defenses",
                  "Advisers and panelists reviewing schedules and requests",
                  "Program coordinators and administrators handling approvals",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 size-2 rounded-full bg-brand" />
                    <p className="text-body-sm">{item}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </SectionShell>

        <SectionShell
          id="colors"
          eyebrow="Color System"
          title="Brand palette and semantic status colors"
          description="Semantic tokens drive the shadcn components so the same colors carry through buttons, form focus states, alerts, and badges."
        >
          <div className="space-y-8">
            <div>
              <SectionLabel>Primary Colors</SectionLabel>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {primarySwatches.map((swatch) => (
                  <ColorSwatchCard key={swatch.name} swatch={swatch} />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Status Colors</SectionLabel>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {statusSwatches.map((swatch) => (
                  <ColorSwatchCard key={swatch.name} swatch={swatch} />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Neutrals</SectionLabel>
              <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                {grayscaleSwatches.map((swatch) => (
                  <ColorSwatchCard key={swatch.name} swatch={swatch} />
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <GradientCard
                title="Primary Gradient"
                recipe="from-primary to-primary-light"
                className="bg-linear-to-r from-primary to-primary-light"
              />
              <GradientCard
                title="Background Gradient"
                recipe="from-primary-tint via-background to-background"
                className="bg-linear-to-r from-primary-tint via-background to-background"
              />
              <GradientCard
                title="Accent Gradient"
                recipe="from-violet to-primary-light"
                className="bg-linear-to-r from-violet to-primary-light"
              />
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="typography"
          eyebrow="Typography"
          title="Poppins with a compact, operational type scale"
          description="The scale stays readable in dense views and preserves enough contrast between page headings, card titles, body copy, and metadata."
        >
          <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Font Family</CardTitle>
                <CardDescription>
                  Imported through `next/font` and applied as the app-wide sans
                  family.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-subheading">Poppins</div>
                <p className="text-body-sm">
                  Supported weights: 300, 400, 500, 600, and 700.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Light", "Regular", "Medium", "Semibold", "Bold"].map(
                    (item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Type Scale</CardTitle>
                <CardDescription>
                  Display size is restrained so dashboards and admin forms stay
                  balanced.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {typeScale.map((item, index) => (
                  <div key={item.name} className="space-y-2">
                    {index > 0 ? <Separator /> : null}
                    <div className="space-y-2 pt-5 first:pt-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-label">{item.name}</span>
                        <CodeToken>{item.token}</CodeToken>
                      </div>
                      <div className={item.className}>{item.sample}</div>
                      <p className="text-body-sm">{item.usage}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </SectionShell>

        <SectionShell
          id="buttons"
          eyebrow="Buttons"
          title="Action styles for primary, supporting, and destructive flows"
          description="Button variants stay pill-shaped and compact, which matches the provided system and works well in repeated table and form contexts."
        >
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Variants</CardTitle>
                <CardDescription>
                  Main action, supporting action, and low-emphasis interaction
                  states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Plus />
                    Add New
                  </Button>
                  <Button variant="outline">
                    <Download />
                    Download
                  </Button>
                  <Button variant="ghost">
                    Search
                    <ArrowRight />
                  </Button>
                </div>
                <Button className="w-full">
                  Continue to consultation details
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Notes</CardTitle>
                <CardDescription>
                  Recommended pairing of variants with action severity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <UsageItem
                  title="Primary"
                  description="Save, submit, approve, schedule, and confirm."
                  indicatorClassName="bg-button-primary"
                />
                <UsageItem
                  title="Secondary / Outline"
                  description="Cancel, back, export, and lower-priority navigation."
                  indicatorClassName="bg-button-secondary"
                />
                <UsageItem
                  title="Ghost"
                  description="Toolbar actions and lightweight list controls."
                  indicatorClassName="bg-button-ghost-hover"
                />
                <UsageItem
                  title="Destructive"
                  description="Delete, reject, archive, or revoke actions."
                  indicatorClassName="bg-button-destructive"
                />
              </CardContent>
            </Card>
          </div>
        </SectionShell>

        <SectionShell
          id="forms"
          eyebrow="Form Elements"
          title="Inputs, selects, checks, and toggles"
          description="Controls use the same border, radius, focus ring, and spacing rhythm so multi-step scheduling forms feel coherent."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Text Inputs</CardTitle>
                <CardDescription>
                  Compact fields with helper text and consistent validation
                  spacing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FieldBlock
                  label="Default Input"
                  helper="Use for names, titles, and single-line scheduling inputs."
                >
                  <Input placeholder="Enter text..." />
                </FieldBlock>
                <FieldBlock label="With Value">
                  <Input defaultValue="Sample thesis title" />
                </FieldBlock>
                <FieldBlock label="Email Input">
                  <Input type="email" defaultValue="student@up.edu.ph" />
                </FieldBlock>
                <FieldBlock label="Disabled Input">
                  <Input disabled defaultValue="Archived schedule" />
                </FieldBlock>
                <FieldBlock
                  label="Textarea"
                  helper="Use for notes and long descriptions."
                >
                  <Textarea defaultValue="Enter detailed scheduling instructions or consultation context." />
                </FieldBlock>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selections & Toggles</CardTitle>
                <CardDescription>
                  Appropriate for departments, notifications, and lightweight
                  review states.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FieldBlock label="Department">
                  <Select defaultValue="cs">
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cs">Computer Science</SelectItem>
                      <SelectItem value="it">Information Technology</SelectItem>
                      <SelectItem value="bio">Biology</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldBlock>

                <div className="space-y-4">
                  <div className="text-label">Checkboxes</div>
                  <div className="space-y-3">
                    <InlineControl
                      control={<Checkbox defaultChecked id="confirm" />}
                      label="Checked by default"
                    />
                    <InlineControl
                      control={<Checkbox id="unchecked" />}
                      label="Unchecked checkbox"
                    />
                    <InlineControl
                      control={<Checkbox disabled id="disabled" />}
                      label="Disabled checkbox"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-label">Switches</div>
                  <div className="space-y-3">
                    <SwitchRow
                      label="Email Notifications"
                      description="Send updates when schedules change."
                      defaultChecked
                    />
                    <SwitchRow
                      label="Push Notifications"
                      description="Useful for same-day reminders."
                    />
                    <SwitchRow
                      label="Disabled switch"
                      description="Unavailable until department sync completes."
                      disabled
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SectionShell>

        <SectionShell
          id="badges"
          eyebrow="Badges & Status"
          title="Status labels that match scheduling outcomes"
          description="Badge colors align with their corresponding alerts and card accents so the system reads consistently at a glance."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Badges</CardTitle>
                <CardDescription>
                  Use a single color mapping for status everywhere in the
                  product.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Badge variant="success">Approved</Badge>
                <Badge variant="destructive">Rejected</Badge>
                <Badge variant="info">In Review</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="violet">Rescheduled</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regular Badges</CardTitle>
                <CardDescription>
                  Useful for category labels, metadata, and lightweight filters.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Badge>Consultation</Badge>
                <Badge variant="secondary">Defense</Badge>
                <Badge variant="outline">Available</Badge>
                <Badge variant="info">Busy</Badge>
                <Badge variant="warning">Medium Priority</Badge>
              </CardContent>
            </Card>
          </div>
        </SectionShell>

        <SectionShell
          id="cards"
          eyebrow="Cards"
          title="Surface treatments for grouped information"
          description="Default cards keep a subtle border and low elevation. Higher-emphasis surfaces can add tinted fills or a stronger shadow."
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>
                  Standard container with title, description, and content.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-body">
                <p>
                  Use for grouped scheduling details, panel summaries, and
                  department metadata where content density matters more than
                  visual emphasis.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Header</Badge>
                  <Badge variant="outline">Description</Badge>
                  <Badge variant="outline">Content</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-transparent shadow-elevated">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  Stronger depth for summary panels and key dashboard widgets.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-body">
                Prefer this treatment for high-value stats or workflow callouts
                rather than every repeated item.
              </CardContent>
            </Card>

            <Card className="border-card-info bg-card-info">
              <CardHeader>
                <CardTitle>Info Card</CardTitle>
                <CardDescription>
                  Tinted background for schedules requiring attention or
                  follow-up.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-body text-card-info">
                Information cards help bring visibility to upcoming deadlines or
                coordination notes without escalating into warning or error
                styling.
              </CardContent>
            </Card>

            <Card className="border-card-success bg-card-success">
              <CardHeader>
                <CardTitle>Success Card</CardTitle>
                <CardDescription>
                  Positive confirmation after the workflow completes.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-card-success text-body">
                Use for confirmed consultation requests, approved panel
                assignments, and completed defense scheduling.
              </CardContent>
            </Card>
          </div>
        </SectionShell>

        <SectionShell
          id="alerts"
          eyebrow="Alerts & Notifications"
          title="Inline messaging patterns"
          description="Alerts should stay concise and visibly tied to the severity of the message."
        >
          <div className="space-y-4">
            <Alert>
              <Info />
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>
                Used for general information that does not need a status color.
              </AlertDescription>
            </Alert>
            <Alert variant="info">
              <Info />
              <AlertTitle>Info Alert</AlertTitle>
              <AlertDescription>
                Helpful tips, reminders, or contextual instructions for
                scheduling flows.
              </AlertDescription>
            </Alert>
            <Alert variant="success">
              <CheckCircle2 />
              <AlertTitle>Success Alert</AlertTitle>
              <AlertDescription>
                Confirmations for saved schedules, accepted requests, and
                completed actions.
              </AlertDescription>
            </Alert>
            <Alert variant="warning">
              <TriangleAlert />
              <AlertTitle>Warning Alert</AlertTitle>
              <AlertDescription>
                Cautionary messaging when a user can still recover or review the
                action.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Error Alert</AlertTitle>
              <AlertDescription>
                Critical warnings and errors that block scheduling or approval
                tasks.
              </AlertDescription>
            </Alert>
          </div>
        </SectionShell>

        <SectionShell
          id="layout"
          eyebrow="Layout System"
          title="Icons, spacing, breakpoints, and grid examples"
          description="These supporting rules keep dense admin screens stable across mobile, tablet, and desktop."
        >
          <div className="space-y-8">
            <div>
              <SectionLabel>Icon Library</SectionLabel>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {iconTiles.map((tile) => (
                  <IconCard key={tile.label} tile={tile} />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>Sidebar Pattern</SectionLabel>
              <div className="mt-4 grid gap-6 xl:grid-cols-[280px_1fr]">
                <div className="overflow-hidden rounded-[2rem] border border-surface shadow-elevated">
                  <Sidebar
                    brandName="ThesisSync"
                    brandSubtitle="Student Portal"
                    brandHref="#brand"
                    items={sidebarItems}
                    activeHref="#consultations"
                    user={sidebarUser}
                    logoutHref="#guidelines"
                    className="min-h-[760px] w-full border-r-0"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Reusable App Sidebar</CardTitle>
                    <CardDescription>
                      A dedicated shell component for student dashboards,
                      consultation lists, and scheduling screens.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <p className="text-body">
                      The component uses the same brand blue, pill navigation,
                      muted metadata, and spacing rhythm defined across the
                      design system while keeping the darker left rail shown in
                      the provided mock.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <CodeToken>components/ui/sidebar.tsx</CodeToken>
                      <CodeToken>bg-sidebar</CodeToken>
                      <CodeToken>text-sidebar-foreground</CodeToken>
                      <CodeToken>bg-sidebar-primary</CodeToken>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <UsageItem
                        title="Navigation"
                        description="Typed items accept a label, href, and icon, with the active route highlighted in brand blue."
                        indicatorClassName="bg-brand"
                      />
                      <UsageItem
                        title="Footer"
                        description="Profile details and logout stay anchored at the bottom for portal-style layouts."
                        indicatorClassName="bg-primary-light"
                      />
                      <UsageItem
                        title="Theme"
                        description="Sidebar-specific CSS variables keep the component visually distinct without breaking the shared token system."
                        indicatorClassName="bg-violet"
                      />
                      <UsageItem
                        title="Usage"
                        description="Drop it into a layout and override `activeHref` from the current route or page context."
                        indicatorClassName="bg-info"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Spacing Scale</CardTitle>
                  <CardDescription>
                    Use a restrained spacing ladder and avoid arbitrary gaps.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {spacingScale.map((item) => (
                    <div
                      key={item.token}
                      className="grid gap-3 md:grid-cols-[80px_1fr]"
                    >
                      <CodeToken>{item.token}</CodeToken>
                      <div className="flex items-center gap-4 rounded-lg border border-surface bg-surface-muted px-4 py-3">
                        <div
                          className={cn(
                            "h-3 rounded-full bg-brand",
                            item.width,
                          )}
                        />
                        <div className="space-y-0.5">
                          <div className="text-label">{item.value}</div>
                          <div className="text-body-sm">{item.note}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Radius</CardTitle>
                    <CardDescription>
                      The system stays mostly at 4px and 8px, with full pills
                      for action controls.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <ShapePreview label="None" className="rounded-none" />
                    <ShapePreview label="Small" className="rounded-sm" />
                    <ShapePreview label="Large" className="rounded-lg" />
                    <ShapePreview label="Full" className="rounded-full" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Shadows</CardTitle>
                    <CardDescription>
                      Elevation is subtle by default and used selectively.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-3">
                    <ShadowPreview label="Small" className="shadow-soft" />
                    <ShadowPreview
                      label="Elevated"
                      className="shadow-elevated"
                    />
                    <ShadowPreview label="Glow" className="shadow-glow" />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Responsive Breakpoints</CardTitle>
                  <CardDescription>
                    Mobile-first structure with progressively wider multi-column
                    layouts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {breakpoints.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-lg border border-surface bg-surface-muted px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-label font-semibold">
                          {item.name}
                        </span>
                        <CodeToken>{item.prefix}</CodeToken>
                        <span className="text-body-sm">{item.range}</span>
                      </div>
                      <p className="mt-2 text-body-sm">{item.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Grid Patterns</CardTitle>
                  <CardDescription>
                    Common layouts used in forms, stats, and operational
                    dashboards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <GridPreview
                    title="2 Column Grid"
                    recipe="grid md:grid-cols-2 gap-4"
                    columns={2}
                  />
                  <GridPreview
                    title="3 Column Grid"
                    recipe="grid md:grid-cols-3 gap-4"
                    columns={3}
                  />
                  <GridPreview
                    title="4 Column Stats"
                    recipe="grid grid-cols-2 md:grid-cols-4 gap-4"
                    columns={4}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="guidelines"
          eyebrow="Component Guidelines"
          title="Usage and accessibility rules"
          description="These rules are the guardrails for implementing new screens so the system stays coherent over time."
        >
          <div className="space-y-8">
            <div className="grid gap-6 xl:grid-cols-2">
              {guidelineGroups.map((group) => (
                <Card key={group.title}>
                  <CardHeader>
                    <CardTitle>{group.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.points.map((point) => (
                      <div key={point} className="flex items-start gap-3">
                        <div className="mt-1 size-2 rounded-full bg-brand" />
                        <p className="text-body-sm">{point}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div>
              <SectionLabel>Accessibility</SectionLabel>
              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {accessibilityCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className={cn(
                        "flex items-start gap-4 rounded-xl border px-4 py-4",
                        item.tone,
                      )}
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-frosted">
                        <Icon className="size-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-label font-semibold">
                          {item.title}
                        </div>
                        <p className="text-body-sm">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionShell>
      </div>
    </main>
  );
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-surface py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
        <div className="space-y-3">
          <p className="text-eyebrow">{eyebrow}</p>
          <h2 className="text-subheading">{title}</h2>
          <p className="text-body-sm">{description}</p>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-label">{children}</div>;
}

function CodeToken({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-surface-muted px-2 py-1 font-mono text-caption">
      {children}
    </span>
  );
}

function ColorSwatchCard({ swatch }: { swatch: Swatch }) {
  return (
    <div className="rounded-xl border border-surface bg-surface-card p-4 shadow-soft">
      <div
        className={cn(
          "h-20 rounded-lg border border-surface",
          swatch.className,
          swatch.dark ? "shadow-[inset_0_1px_0_rgb(255_255_255_/_0.18)]" : "",
        )}
      />
      <div className="mt-4 space-y-1.5">
        <div className="text-label font-semibold">{swatch.name}</div>
        <CodeToken>{swatch.value}</CodeToken>
        <p className="text-body-sm">{swatch.usage}</p>
      </div>
    </div>
  );
}

function GradientCard({
  title,
  recipe,
  className,
}: {
  title: string;
  recipe: string;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-surface bg-surface-card p-4 shadow-soft">
      <div className={cn("h-20 rounded-lg", className)} />
      <div className="mt-4 space-y-1.5">
        <div className="text-label font-semibold">{title}</div>
        <CodeToken>{recipe}</CodeToken>
      </div>
    </div>
  );
}

function UsageItem({
  title,
  description,
  indicatorClassName,
}: {
  title: string;
  description: string;
  indicatorClassName: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("mt-1 size-2 rounded-full", indicatorClassName)} />
      <div className="space-y-0.5">
        <div className="text-label">{title}</div>
        <p className="text-body-sm">{description}</p>
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {helper ? <p className="text-body-sm">{helper}</p> : null}
    </div>
  );
}

function InlineControl({
  control,
  label,
}: {
  control: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {control}
      <Label className="text-content">{label}</Label>
    </div>
  );
}

function SwitchRow({
  label,
  description,
  defaultChecked,
  disabled,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-surface bg-surface-muted-soft px-4 py-3">
      <div className="space-y-0.5">
        <div className="text-label">{label}</div>
        <p className="text-body-sm">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} disabled={disabled} />
    </div>
  );
}

function IconCard({ tile }: { tile: IconTile }) {
  const Icon = tile.icon;

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-surface bg-surface-card px-4 py-5 text-center shadow-soft">
      <div className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <Icon className="size-5" />
      </div>
      <div className="text-label text-content">{tile.label}</div>
    </div>
  );
}

function ShapePreview({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "h-14 w-full border border-surface bg-demo-shape",
          className,
        )}
      />
      <div className="text-body-sm text-content">{label}</div>
    </div>
  );
}

function ShadowPreview({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="space-y-3">
      <div
        className={cn(
          "h-16 rounded-xl border border-surface bg-surface-card",
          className,
        )}
      />
      <div className="text-body-sm text-content">{label}</div>
    </div>
  );
}

function GridPreview({
  title,
  recipe,
  columns,
}: {
  title: string;
  recipe: string;
  columns: number;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-surface bg-surface-muted-strong p-4">
      <div className="space-y-1">
        <div className="text-label">{title}</div>
        <CodeToken>{recipe}</CodeToken>
      </div>
      <div
        className={cn(
          "grid gap-3",
          columns === 2 && "sm:grid-cols-2",
          columns === 3 && "sm:grid-cols-3",
          columns === 4 && "grid-cols-2 sm:grid-cols-4",
        )}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-lg bg-surface-card px-3 py-4 text-center text-body-sm shadow-soft"
          >
            Column {index + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
