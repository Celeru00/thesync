# ThesisSync Semantic Tailwind Utilities

This file documents the semantic Tailwind utility names added for the ThesisSync design system.

The intent is to avoid wiring product UI directly to palette names like `bg-primary`, `bg-success-soft`, or `text-gray-700` unless the screen is explicitly showing the palette itself.

Primary sources:

- [app/globals.css](/Volumes/DevDisk/Projects/thesync/thesync-frontend/app/globals.css:1)
- [components/ui](/Volumes/DevDisk/Projects/thesync/thesync-frontend/components/ui/button.tsx:1)
- [components/design-system/showcase.tsx](/Volumes/DevDisk/Projects/thesync/thesync-frontend/components/design-system/showcase.tsx:1)

## Naming Approach

- Typography uses role-based names like `text-heading` and `text-body-sm`.
- Surfaces use context-based names like `bg-page` and `bg-surface-card`.
- Component states use component-role names like `bg-button-primary`, `bg-badge-success`, and `bg-alert-info`.
- Shared interaction states use intent-based names like `border-focus`, `ring-focus`, and `border-error`.
- The same underlying color token can have more than one semantic alias when the role is different. For example, `bg-button-ghost-hover` and `bg-button-outline-hover` currently resolve to the same tint, but they stay separate because they represent different UI roles.
- The same rule should apply to future components too. If a toast is added, name it by role: `bg-toast-info`, `text-toast-info`, `border-toast-info`, etc.

## Typography Utilities

| Utility              | Description                                                         | Use                                               |
| -------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| `text-heading`       | 30px semibold primary heading style.                                | Page titles and first-view headings.              |
| `text-subheading`    | 24px semibold secondary heading style.                              | Section headers and major grouped content titles. |
| `text-section-title` | 20px semibold medium-emphasis heading.                              | Panel groups and subsection headers.              |
| `text-card-title`    | 18px semibold compact heading.                                      | Card titles and smaller framed sections.          |
| `text-body`          | 16px regular body text with the standard ThesisSync reading rhythm. | Paragraphs and longer content.                    |
| `text-body-sm`       | 14px regular secondary text.                                        | Helper text, descriptions, and metadata blocks.   |
| `text-caption`       | 12px caption text.                                                  | Tokens, timestamps, captions, and dense metadata. |
| `text-eyebrow`       | Small medium-weight brand-accent label.                             | Section eyebrows and compact brand labels.        |
| `text-label`         | Small medium-weight label style.                                    | Field labels, compact headings, and value labels. |

## Surface And Content Utilities

| Utility                   | Description                                       | Use                                                                    |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------- |
| `bg-page`                 | Main application background.                      | App shell and default page sections.                                   |
| `text-page`               | Main page foreground color.                       | Root-level text color on page surfaces.                                |
| `bg-surface-card`         | Standard card/panel surface color.                | Cards, panels, framed tools, and inputs.                               |
| `text-surface-card`       | Default foreground for card surfaces.             | Text on normal card surfaces.                                          |
| `bg-surface-overlay`      | Floating overlay surface color.                   | Menus, popovers, selects, and overlays.                                |
| `text-surface-overlay`    | Foreground for overlay surfaces.                  | Text inside menus and overlays.                                        |
| `bg-surface-muted`        | Muted neutral surface.                            | Secondary containers and subtle backgrounds.                           |
| `bg-surface-muted-soft`   | Softer muted surface treatment.                   | Light grouped controls and low-emphasis rows.                          |
| `bg-surface-muted-strong` | Stronger muted surface treatment.                 | Card footers and stronger low-contrast bands.                          |
| `bg-surface-frosted`      | Semi-opaque overlay surface.                      | Frosted cards and softened overlay panels.                             |
| `text-content`            | Standard body foreground tone.                    | General copy when `text-body` is too opinionated.                      |
| `text-content-strong`     | Stronger content foreground.                      | Compact headings, outline badges, and link hovers on neutral surfaces. |
| `text-content-muted`      | Secondary foreground tone.                        | Supporting copy, helper text, and muted labels.                        |
| `border-surface`          | Default neutral border color.                     | Cards, sections, separators, and containers.                           |
| `bg-separator`            | Neutral separator fill.                           | Horizontal and vertical separators.                                    |
| `bg-demo-shape`           | Soft preview tint used in design-system examples. | Shape previews and non-product demo placeholders.                      |

## Brand Utilities

These are still semantic, but they describe brand role instead of component role.

| Utility               | Description                                    | Use                                                        |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------- |
| `bg-brand`            | Core ThesisSync brand fill.                    | Brand marks and brand-accent surfaces.                     |
| `bg-brand-strong`     | Stronger brand fill.                           | Hover or high-emphasis brand blocks.                       |
| `bg-brand-soft`       | Soft brand tint.                               | Accent pills, icon discs, and subtle emphasis backgrounds. |
| `text-brand`          | Core brand foreground.                         | Brand-accent text and icons.                               |
| `text-brand-strong`   | Stronger brand foreground.                     | Higher-emphasis brand text.                                |
| `text-brand-on`       | Foreground intended for brand-filled surfaces. | Text/icons on `bg-brand`.                                  |
| `border-brand-subtle` | Very light brand border treatment.             | Highlighted cards and low-emphasis brand-framed panels.    |

## State And Interaction Utilities

These describe interaction intent rather than a specific component.

| Utility             | Description                                          | Use                                                   |
| ------------------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `text-placeholder`  | Placeholder foreground tone.                         | Placeholder text in inputs, textareas, and selects.   |
| `border-focus`      | Standard focus border color.                         | Keyboard focus states across buttons and controls.    |
| `ring-focus`        | Standard focus ring color.                           | Focus ring color across interactive elements.         |
| `border-error`      | Error-state border color.                            | Invalid fields and error-marked interactive elements. |
| `ring-error`        | Error-state ring color.                              | Invalid field ring color.                             |
| `bg-option-hover`   | Hover/focus fill for selectable overlay items.       | Select options and future menu items.                 |
| `text-option-hover` | Hover/focus foreground for selectable overlay items. | Text and icons inside focused select options.         |

## Form And Control Utilities

| Utility                    | Description                              | Use                                                  |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `border-control`           | Standard form control border color.      | Inputs, selects, textareas, checkboxes.              |
| `bg-field-disabled`        | Disabled field background.               | Disabled inputs, selects, and textareas.             |
| `text-field-disabled`      | Disabled field text color.               | Text within disabled controls.                       |
| `bg-checkbox-selected`     | Selected checkbox fill.                  | Checked checkbox states.                             |
| `border-checkbox-selected` | Selected checkbox border color.          | Checked checkbox outlines.                           |
| `text-checkbox-selected`   | Selected checkbox foreground.            | Checkmark/icon color inside checked checkboxes.      |
| `bg-toggle-track-on`       | Active switch track fill.                | On state for switches/toggles.                       |
| `bg-toggle-track-off`      | Inactive switch track fill.              | Off state for switches/toggles.                      |
| `bg-toggle-thumb`          | Default switch thumb fill.               | Base thumb surface.                                  |
| `bg-toggle-thumb-on`       | Active switch thumb fill in dark mode.   | Checked thumb state where contrast needs boosting.   |
| `bg-toggle-thumb-off`      | Inactive switch thumb fill in dark mode. | Unchecked thumb state where contrast needs boosting. |

## Button Utilities

Use these inside button variants and other action surfaces instead of palette names.

| Utility                       | Description                               | Use                                               |
| ----------------------------- | ----------------------------------------- | ------------------------------------------------- |
| `bg-button-primary`           | Primary action fill.                      | Main CTA buttons.                                 |
| `bg-button-primary-hover`     | Hover state for primary buttons.          | Primary button hover styling.                     |
| `text-button-primary`         | Foreground for primary action fill.       | Text/icons on primary buttons.                    |
| `bg-button-secondary`         | Secondary action fill.                    | Supporting filled buttons in their resting state. |
| `bg-button-secondary-hover`   | Hover state for secondary buttons.        | Secondary button hover styling.                   |
| `text-button-secondary`       | Foreground for secondary button surfaces. | Text/icons on secondary buttons.                  |
| `bg-button-outline-hover`     | Hover fill for outline buttons.           | Outline button hover state.                       |
| `text-button-outline`         | Default outline button foreground.        | Text/icons on outline buttons.                    |
| `text-button-outline-hover`   | Hover foreground for outline buttons.     | Outline button hover text/icon color.             |
| `bg-button-ghost-hover`       | Hover fill for ghost-style actions.       | Toolbar and low-emphasis action hover state.      |
| `text-button-ghost`           | Default ghost action foreground.          | Ghost buttons and quiet action text.              |
| `text-button-ghost-hover`     | Hover foreground for ghost actions.       | Ghost button hover text/icon color.               |
| `bg-button-destructive`       | Destructive action fill.                  | Delete, reject, revoke actions.                   |
| `bg-button-destructive-hover` | Hover fill for destructive actions.       | Destructive button hover state.                   |
| `text-button-destructive`     | Foreground for destructive fills.         | Text/icons on destructive buttons.                |
| `text-button-link`            | Link-style action foreground.             | Button variants styled as links.                  |
| `text-button-link-hover`      | Hover foreground for link-style buttons.  | Link button hover state.                          |

## Badge Utilities

These are for badge semantics specifically. Do not reuse them for alerts or cards.

| Utility                  | Description                        | Use                                    |
| ------------------------ | ---------------------------------- | -------------------------------------- |
| `border-badge-primary`   | Border for primary badges.         | Default brand badges.                  |
| `bg-badge-primary`       | Fill for primary badges.           | Brand badges.                          |
| `text-badge-primary`     | Foreground for primary badges.     | Text/icons inside brand badges.        |
| `border-badge-secondary` | Border for secondary badges.       | Low-emphasis filled badges.            |
| `bg-badge-secondary`     | Fill for secondary badges.         | Supporting badges.                     |
| `text-badge-secondary`   | Foreground for secondary badges.   | Text/icons inside supporting badges.   |
| `border-badge-success`   | Border for success badges.         | Approved/completed labels.             |
| `bg-badge-success`       | Soft success fill for badges.      | Approved/completed labels.             |
| `text-badge-success`     | Success foreground for badges.     | Success badge text/icons.              |
| `border-badge-warning`   | Border for warning badges.         | Pending or caution labels.             |
| `bg-badge-warning`       | Soft warning fill for badges.      | Pending or caution labels.             |
| `text-badge-warning`     | Warning foreground for badges.     | Warning badge text/icons.              |
| `border-badge-error`     | Border for error badges.           | Rejected or invalid labels.            |
| `bg-badge-error`         | Soft error fill for badges.        | Rejected or error labels.              |
| `text-badge-error`       | Error foreground for badges.       | Error badge text/icons.                |
| `border-badge-info`      | Border for info badges.            | Informational labels.                  |
| `bg-badge-info`          | Soft info fill for badges.         | Informational labels.                  |
| `text-badge-info`        | Info foreground for badges.        | Info badge text/icons.                 |
| `border-badge-special`   | Border for special-purpose badges. | Rescheduled or standout labels.        |
| `bg-badge-special`       | Soft special-purpose fill.         | Rescheduled or standout labels.        |
| `text-badge-special`     | Special-purpose foreground.        | Text/icons for special-purpose badges. |

## Alert Utilities

These are the current alert-message semantics. If a toast component is added, follow the same role pattern with a `toast` prefix.

| Utility                   | Description                                          | Use                                 |
| ------------------------- | ---------------------------------------------------- | ----------------------------------- |
| `border-alert-default`    | Border for neutral alerts.                           | Default alert containers.           |
| `bg-alert-default`        | Background for neutral alerts.                       | Neutral informational alerts.       |
| `text-alert-default`      | Foreground for neutral alerts.                       | Neutral alert titles/icons.         |
| `border-alert-info`       | Border for info alerts.                              | Helpful informational messages.     |
| `bg-alert-info`           | Soft info background for alerts.                     | Info alerts.                        |
| `text-alert-info`         | Info foreground for alert title/icon.                | Info alert heading/icon color.      |
| `text-alert-info-body`    | Slightly softer info foreground for alert body copy. | Info alert description text.        |
| `border-alert-success`    | Border for success alerts.                           | Confirmation and completion alerts. |
| `bg-alert-success`        | Soft success background for alerts.                  | Success alerts.                     |
| `text-alert-success`      | Success foreground for alert title/icon.             | Success alert heading/icon color.   |
| `text-alert-success-body` | Softer success foreground for body copy.             | Success alert descriptions.         |
| `border-alert-warning`    | Border for warning alerts.                           | Warning and caution alerts.         |
| `bg-alert-warning`        | Soft warning background for alerts.                  | Warning alerts.                     |
| `text-alert-warning`      | Warning foreground for alert title/icon.             | Warning alert heading/icon color.   |
| `text-alert-warning-body` | Softer warning foreground for body copy.             | Warning alert descriptions.         |
| `border-alert-error`      | Border for error alerts.                             | Error and destructive alerts.       |
| `bg-alert-error`          | Soft error background for alerts.                    | Error alerts.                       |
| `text-alert-error`        | Error foreground for alert title/icon.               | Error alert heading/icon color.     |
| `text-alert-error-body`   | Softer error foreground for body copy.               | Error alert descriptions.           |

## Card State Utilities

Use these for stateful cards and emphasized panels, not for generic cards.

| Utility               | Description                               | Use                                                 |
| --------------------- | ----------------------------------------- | --------------------------------------------------- |
| `border-card-info`    | Border for information cards.             | Info panels and highlighted informational sections. |
| `bg-card-info`        | Tinted info card background.              | Informational cards and non-critical callouts.      |
| `text-card-info`      | Foreground for information-card emphasis. | Text on blue-tinted info cards.                     |
| `border-card-success` | Border for success cards.                 | Positive completion panels.                         |
| `bg-card-success`     | Tinted success card background.           | Completed or successful workflow panels.            |
| `text-card-success`   | Foreground for success-card content.      | Text on success state cards.                        |

## Elevation Utilities

| Utility           | Description                   | Use                                                 |
| ----------------- | ----------------------------- | --------------------------------------------------- |
| `shadow-soft`     | Default low-elevation shadow. | Cards, controls, icon tiles, and standard surfaces. |
| `shadow-elevated` | Stronger raised shadow.       | Highlight cards and floating emphasis surfaces.     |
| `shadow-glow`     | Brand glow shadow.            | Brand icon blocks and emphasis accents.             |

## What Still Uses Raw Palette Utilities

Some raw color utilities are still intentionally present:

- the palette swatch section in the design-system page
- one-off visual markers that are demonstrating the palette itself
- gradient demos that are explicitly showing the base palette recipe

That distinction is intentional:

- palette demos show the palette
- reusable UI should prefer the semantic names above
