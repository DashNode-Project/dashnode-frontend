# UX/UI Identity Report — DashNode

**Version:** 1.0  
**Date:** 2026-09-30  
**Design System:** DashNode Design System v1  
**Theme:** Dark Professional  

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Library](#component-library)
6. [Icon System](#icon-system)
7. [Layout & Grid](#layout--grid)
8. [Animation Principles](#animation-principles)
9. [Responsive Breakpoints](#responsive-breakpoints)
10. [Accessibility Standards](#accessibility-standards)
11. [AI Widget Design](#ai-widget-design)
12. [Page-Specific Design Notes](#page-specific-design-notes)

---

## Design Philosophy

DashNode's visual identity is built around three core principles:

### 1. Dark-First Professional
The application is exclusively dark-themed, optimized for developers who spend long hours in front of screens. The color palette uses near-black backgrounds with controlled levels of surface elevation to create depth without harshness.

### 2. Information Density with Clarity
Project management tools must display a lot of information. DashNode achieves high information density by using compact spacing within structured containers, clear visual hierarchy, and color-coded status indicators — without sacrificing readability.

### 3. Role-Aware UI
The interface adapts to the user's role. Admins see controls and data that managers and developers do not. This is reflected not just in what is shown, but in visual prominence — admin-only actions have a slightly different visual weight (primary blue vs secondary gray).

---

## Color Palette

### Background Scale

The background system uses a layered elevation model. Each layer is slightly lighter than the one below it.

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `bg-base` | `#0A0B0E` | App root background, sidebar backdrop |
| `bg-surface` | `#12131C` | Cards, modals, panels, main content area |
| `bg-elevated` | `#1A1B27` | Nested cards, dropdown menus, hover states |
| `bg-input` | `#1E1F2B` | Text inputs, textareas, select boxes |
| `bg-overlay` | `rgba(0,0,0,0.7)` | Modal backdrop overlays |

### Text Colors

| Token | Hex Value | Usage |
|-------|-----------|-------|
| `text-primary` | `#F9FAFB` | Body text, headings, labels |
| `text-secondary` | `#9CA3AF` | Captions, placeholders, secondary labels |
| `text-muted` | `#6B7280` | Disabled text, tertiary labels |
| `text-inverse` | `#0A0B0E` | Text on light backgrounds (e.g. yellow badges) |

### Brand / Accent Colors

| Token | Hex Value | Tailwind Equivalent | Usage |
|-------|-----------|--------------------|-|
| `brand-primary` | `#3B82F6` | `blue-500` | Primary actions, active nav, selected state |
| `brand-primary-hover` | `#2563EB` | `blue-600` | Hover state on primary buttons |
| `brand-primary-muted` | `rgba(59,130,246,0.15)` | `blue-500/15` | Subtle highlights, selected rows |
| `brand-secondary` | `#8B5CF6` | `violet-500` | Secondary accents, AI-related UI |

### Semantic Colors

| Semantic | Hex | Tailwind | Usage |
|----------|-----|----------|-------|
| Success | `#10B981` | `emerald-500` | Completed, resolved, passed |
| Warning | `#F59E0B` | `amber-500` | In-progress, review, warnings |
| Danger | `#EF4444` | `red-500` | Errors, critical severity, failed |
| Info | `#06B6D4` | `cyan-500` | Informational, testing status |
| Purple | `#8B5CF6` | `violet-500` | AI-generated content, knowledge entries |
| Indigo | `#6366F1` | `indigo-500` | Epics, sprint identifiers |

### Status Color Mapping

| Status | Color Token | Hex |
|--------|------------|-----|
| `todo` | `text-secondary` | `#9CA3AF` |
| `in-progress` | `amber-500` | `#F59E0B` |
| `code-review` | `blue-400` | `#60A5FA` |
| `testing` | `cyan-500` | `#06B6D4` |
| `fixing` | `red-500` | `#EF4444` |
| `completed` | `emerald-500` | `#10B981` |
| Priority: critical | `red-500` | `#EF4444` |
| Priority: high | `orange-500` | `#F97316` |
| Priority: medium | `amber-500` | `#F59E0B` |
| Priority: low | `slate-400` | `#94A3B8` |

### Border Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `rgba(255,255,255,0.08)` | Card borders, dividers |
| `border-focused` | `#3B82F6` | Input focus ring |
| `border-danger` | `#EF4444` | Error state borders |

---

## Typography

### Font Families

| Role | Font | Fallback Stack | Weights Used |
|------|------|----------------|-------------|
| **UI / Interface** | Inter | `system-ui, sans-serif` | 400, 500, 600, 700 |
| **Code / Monospace** | JetBrains Mono | `'Courier New', monospace` | 400, 500 |
| **Display (headings)** | Inter | same as UI | 600, 700 |

### Type Scale

| Name | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `text-xs` | 12px (0.75rem) | 16px | 400 | Timestamps, captions, badge text |
| `text-sm` | 14px (0.875rem) | 20px | 400/500 | Body text, table cells, inputs |
| `text-base` | 16px (1rem) | 24px | 400/500 | Standard paragraph text |
| `text-lg` | 18px (1.125rem) | 28px | 500/600 | Section headings |
| `text-xl` | 20px (1.25rem) | 28px | 600 | Card headings, modal titles |
| `text-2xl` | 24px (1.5rem) | 32px | 600/700 | Page headings |
| `text-3xl` | 30px (1.875rem) | 36px | 700 | Landing page hero |
| `text-4xl` | 36px (2.25rem) | 40px | 700 | Landing headline |
| `code-sm` | 12px JetBrains | 18px | 400 | Inline code, commit SHAs |
| `code-base` | 14px JetBrains | 20px | 400 | Code blocks, log output |

### Font Loading Strategy

Fonts are loaded via `@import` in `src/index.css` using Google Fonts CDN:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  font-family: 'Inter', system-ui, sans-serif;
}

code, pre, .font-mono {
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}
```

---

## Spacing System

DashNode uses Tailwind CSS v4's default 4px base spacing scale.

### Key Spacing Values

| Tailwind Class | Value | Usage |
|---------------|-------|-------|
| `p-1` | 4px | Tight internal padding (badges, chips) |
| `p-2` | 8px | Icon button padding |
| `p-3` | 12px | Small component padding |
| `p-4` | 16px | Standard card padding |
| `p-6` | 24px | Modal body padding |
| `p-8` | 32px | Page content padding |
| `gap-2` | 8px | Tight flex gap (badge groups) |
| `gap-3` | 12px | Form field spacing |
| `gap-4` | 16px | Card grid gap |
| `gap-6` | 24px | Section gap |

### Container Widths

| Container | Width | Usage |
|-----------|-------|-------|
| Sidebar | 256px (w-64) | Fixed left navigation |
| Main content | `calc(100vw - 256px)` | Full-height scrollable content |
| Modal small | 400px (max-w-md) | Confirmation dialogs |
| Modal medium | 560px (max-w-lg) | Create/edit forms |
| Modal large | 720px (max-w-2xl) | Complex forms (Fix detail) |
| Modal full | 900px (max-w-4xl) | AI analysis, DevOps views |

---

## Component Library

### Button

Four variants, consistent sizing scale:

```tsx
// Variants
<Button variant="primary">   // blue-500 bg, white text
<Button variant="secondary"> // transparent, border, text-secondary
<Button variant="ghost">     // transparent, no border, hover bg
<Button variant="danger">    // red-500/20 bg, red-400 text

// Sizes
<Button size="xs">  // px-2 py-1 text-xs
<Button size="sm">  // px-3 py-1.5 text-sm
<Button size="md">  // px-4 py-2 text-sm (default)
<Button size="lg">  // px-6 py-3 text-base
```

**Design rules:**
- All buttons have `rounded-lg` (8px radius)
- Icon buttons (icon-only) use `p-2` with `rounded-lg`
- Disabled state uses `opacity-50 cursor-not-allowed`
- Loading state shows a spinner replacing text

---

### Card

Base surface container:

```tsx
<Card className="p-4 rounded-xl border border-white/8">
  {/* content */}
</Card>
```

**Card variants:**
- `Card` — base surface (`bg-[#12131C]`)
- `Card` with `hover:border-blue-500/30` — interactive card
- `StatCard` — KPI card with icon, value, label, trend indicator

---

### Modal

All modals follow a consistent structure:

```
┌─────────────────────────────────────┐
│  Modal Header                    ✕  │
│  Title                              │
├─────────────────────────────────────┤
│                                     │
│  Modal Body (scrollable)            │
│  Form fields / content              │
│                                     │
├─────────────────────────────────────┤
│  Cancel          Confirm Action     │
└─────────────────────────────────────┘
```

**Design rules:**
- Always rendered with `fixed inset-0` overlay (`bg-black/70`)
- Modal itself is `relative z-50 bg-[#12131C] rounded-2xl`
- Close button (X) in top-right corner
- Escape key closes modal
- Body scrolls if content exceeds `max-h-[80vh]`

---

### Badge / StatusBadge

Compact colored labels:

```tsx
// Priority badge
<Badge variant="critical">Critical</Badge>  // red bg/text
<Badge variant="high">High</Badge>          // orange bg/text
<Badge variant="medium">Medium</Badge>      // amber bg/text
<Badge variant="low">Low</Badge>            // slate bg/text

// Status badge
<StatusBadge status="todo" />               // gray
<StatusBadge status="in-progress" />        // amber
<StatusBadge status="code-review" />        // blue
<StatusBadge status="testing" />            // cyan
<StatusBadge status="fixing" />             // red (with pulsing dot)
<StatusBadge status="completed" />          // emerald
```

**Anatomy:**
```
[dot] [label text]
```
- `fixing` status uses a pulsing animation dot to signal urgency
- Rounded-full pill shape with `px-2 py-0.5`

---

### Avatar

Displays user identity:

```tsx
<Avatar user={user} size="sm" />  // 24px
<Avatar user={user} size="md" />  // 32px (default)
<Avatar user={user} size="lg" />  // 40px
<Avatar user={user} size="xl" />  // 64px
```

**Logic:**
1. If `avatar_url` exists, display the image
2. If no image, generate initials from `name` (first + last initial)
3. Background color derived from user ID hash (consistent per user)
4. Initials text is white on colored background

---

### Input / Select / Textarea

All form inputs follow the same base style:

```
bg-[#1E1F2B]
border border-white/10
rounded-lg
px-3 py-2
text-sm text-gray-100
placeholder:text-gray-500
focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
```

Error state adds `border-red-500 focus:ring-red-500`.

---

### ProgressBar

Used in sprint cards, fix resolution, project overview:

```tsx
<ProgressBar value={65} label="65% complete" colorVariant="blue" />
<ProgressBar value={90} label="90% coverage" colorVariant="emerald" />
<ProgressBar value={30} label="At risk" colorVariant="red" />
```

**Anatomy:**
```
[Track: bg-white/10, rounded-full, h-2]
  └─ [Fill: colored, rounded-full, transition-width]
[Optional label text below or to right]
```

---

### EmptyState

Used in every list/table when no items exist:

```tsx
<EmptyState
  icon={<PackageOpen />}
  title="No projects yet"
  description="Create your first project to get started"
  action={<Button onClick={...}>Create Project</Button>}
/>
```

**Layout:** Centered in container, icon above title, description below, optional action button.

---

### StatCard

KPI metric card on Dashboard and AI Metrics pages:

```tsx
<StatCard
  title="Open Issues"
  value={12}
  subtitle="3 critical"
  icon={<AlertTriangle />}
  trend={{ direction: 'up', value: '2 from last week', isPositive: false }}
  colorVariant="red"
/>
```

**Layout:**
```
┌─────────────────────────────┐
│ [Icon]              [Trend] │
│ [Value]                     │
│ [Title]                     │
│ [Subtitle]                  │
└─────────────────────────────┘
```

---

## Icon System

All icons use **lucide-react** v1.49.0, imported individually for tree-shaking:

```typescript
import { LayoutDashboard, FolderKanban, Bug, Zap } from 'lucide-react';
```

### Icon Sizing Convention

| Context | Size (px) | Tailwind |
|---------|-----------|---------|
| Navigation sidebar | 20px | `size-5` |
| Button icons | 16px | `size-4` |
| Heading icons | 20px | `size-5` |
| Large feature icons | 24px | `size-6` |
| Empty state icons | 48px | `size-12` |
| Stat card icons | 24px | `size-6` |

### Key Icon Assignments

| UI Element | Icon |
|------------|------|
| Dashboard | `LayoutDashboard` |
| Projects | `FolderKanban` |
| Sprints | `Layers` |
| Kanban | `KanbanSquare` |
| Meetings | `Calendar` |
| Fixes | `Bug` |
| Knowledge | `BookOpen` |
| DevOps | `GitBranch` |
| AI | `Zap` |
| Notifications | `Bell` |
| Users | `Users` |
| My Tasks | `CheckSquare` |
| Command Palette | `Search` |
| Settings / Profile | `Settings` |
| Evidence (screenshot) | `Image` |
| Evidence (log) | `FileText` |
| Pipeline success | `CheckCircle2` |
| Pipeline failure | `XCircle` |
| Pipeline running | `Loader2` (with spin animation) |

---

## Layout & Grid

### Application Shell Layout

```
┌──────────────────────────────────────────────────────┐
│                    App Root (100vw)                   │
│  ┌──────────┐  ┌─────────────────────────────────┐   │
│  │          │  │                                 │   │
│  │ Sidebar  │  │        Main Content Area        │   │
│  │ (256px)  │  │   (calc(100vw - 256px))         │   │
│  │  fixed   │  │         scrollable              │   │
│  │          │  │                                 │   │
│  └──────────┘  └─────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘

Overlays (z-50+):
- Command Palette (fixed, centered)
- AI Widget (fixed, bottom-right)
- Notification Panel (fixed, right side)
- Modal (fixed, centered with backdrop)
```

### Card Grid Patterns

| Pattern | Grid | Usage |
|---------|------|-------|
| KPI Row | `grid-cols-4` | Dashboard stat cards |
| Project Cards | `grid-cols-3` | Project list |
| 2-up | `grid-cols-2` | Split content |
| Full-width | `grid-cols-1` | List views |

---

## Animation Principles

All animations use CSS transitions with consistent easing and duration:

| Animation Type | Duration | Easing | Tailwind |
|---------------|---------|--------|---------|
| Button hover | 150ms | ease-in-out | `transition-colors duration-150` |
| Modal open/close | 200ms | ease-out | `transition-all duration-200` |
| Sidebar nav hover | 150ms | ease | `transition-colors duration-150` |
| Progress bar fill | 500ms | ease-out | `transition-[width] duration-500` |
| Notification slide | 300ms | ease-out | `transition-transform duration-300` |
| AI Widget open | 250ms | ease-out | `transition-all duration-250` |
| Spinner (loading) | ∞ | linear | `animate-spin` |
| Pulsing dot (fixing) | ∞ | ease-in-out | `animate-pulse` |
| Skeleton loading | ∞ | ease-in-out | `animate-pulse` |

**Principles:**
1. No animation exceeds 400ms (except infinite loaders)
2. Interactive elements always have hover transitions
3. Modals use opacity + scale transform for open animation
4. Prefer CSS transitions over JavaScript animations
5. Respect `prefers-reduced-motion` media query (not yet fully implemented)

---

## Responsive Breakpoints

DashNode targets desktop-first. Mobile is not a primary use case.

| Breakpoint | Width | Tailwind Prefix | Target |
|-----------|-------|----------------|--------|
| Desktop default | ≥ 1280px | (none) | Primary target |
| Large desktop | ≥ 1536px | `2xl:` | Wide monitors |
| Tablet | ≥ 768px | `md:` | Fallback |
| Mobile | ≥ 320px | `sm:` | Not supported (read-only) |

**Mobile strategy:** The app renders on mobile but is not optimized. Sidebar collapses to an icon rail on < 768px. This is documented as a known limitation.

---

## Accessibility Standards

### Current Implementation

| Standard | Status | Notes |
|----------|--------|-------|
| Color contrast (WCAG AA) | Partial | Primary text passes; muted text at borderline |
| Keyboard navigation | Partial | Modals and command palette; full nav not complete |
| Focus management | Partial | Modals trap focus; other overlays do not |
| Screen reader labels | Partial | Most icons have `aria-label`; some missing |
| Skip navigation | Not implemented | Planned in future iteration |
| ARIA roles | Partial | Dialogs correct; live regions missing |

### Design Color Contrast Ratios

| Pair | Contrast Ratio | WCAG AA (4.5:1) |
|------|---------------|-----------------|
| `#F9FAFB` on `#0A0B0E` | 18.5:1 | Pass |
| `#F9FAFB` on `#12131C` | 16.2:1 | Pass |
| `#9CA3AF` on `#0A0B0E` | 7.2:1 | Pass |
| `#6B7280` on `#12131C` | 4.1:1 | Borderline (fail at AA) |
| `#3B82F6` on `#0A0B0E` | 5.9:1 | Pass |
| White text on `red-500` badge | 4.7:1 | Pass |

**Action item:** `text-muted` (`#6B7280`) fails WCAG AA for normal text. Recommend upgrading to `#71717A` or using only for large text (18px+).

---

## AI Widget Design

The AI Floating Widget is the most distinctive UI element in DashNode.

### Visual Design

```
[Bottom-right corner, 24px from edges]

Collapsed state:
┌──────┐
│  ✦   │  ← 56px round button, violet gradient
└──────┘

Expanded state:
┌────────────────────────────┐
│ AI Assistant             ✕ │  ← Header bar
│ [Model: claude-3-5-sonnet] │
├────────────────────────────┤
│                            │
│ [Message history]          │  ← Scrollable, max 400px
│                            │
│ User: how do I...          │
│ AI: Here's how...         │
│                            │
├────────────────────────────┤
│ [Text input         ] [→]  │  ← Input row
└────────────────────────────┘
```

### Color Scheme (AI Widget)
- Background: `#12131C` (same as cards)
- Header gradient: `from-violet-500/20 to-blue-500/20`
- Trigger button: `bg-gradient-to-br from-violet-600 to-blue-600`
- AI response bubble: `bg-violet-500/10 border-violet-500/20`
- User message bubble: `bg-blue-500/10 border-blue-500/20`

### Behavior
- Opens/closes with animation (scale + opacity)
- Persists position at bottom-right
- Maintains conversation history within session
- Shows typing indicator (three animated dots) while "generating"
- Logs every interaction to `AIContext`

---

## Page-Specific Design Notes

### Dashboard
- Role-aware: 4-column KPI row, project list, activity feed
- Admin sees all; manager sees their projects; developer sees personal tasks
- Charts use CSS-only bar charts (no chart library dependency)

### Kanban Board
- Six columns with fixed headers
- Columns scroll independently (overflow-y: auto)
- Each column shows count badge
- 'fixing' column has a red glow border to signal urgency

### Fixes Module
- Evidence thumbnails shown in 2-column grid
- AI Analysis panel uses violet accent to distinguish AI content from human content
- Confidence score shown as a circular indicator

### DevOps Pipeline
- Stages shown as connected nodes with arrows
- Running step has a pulsing animation
- Failed step shows red background with error icon
- Quality gates shown as separate row below pipeline

### Knowledge Base
- Approval queue visible only to admin/manager
- Pending entries shown with amber border
- Approved entries have a subtle emerald indicator
- Search highlights matching text (CSS `mark` element)
