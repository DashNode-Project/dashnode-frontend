# Requirements Document — DashNode

**Version:** 1.0  
**Date:** 2026-09-30  
**Status:** Baseline (post-MVP3)  
**Methodology:** Agile (Scrum), requirements captured as User Stories  

---

## Table of Contents

1. [Introduction](#introduction)
2. [Stakeholders & Roles](#stakeholders--roles)
3. [System Overview](#system-overview)
4. [Functional Requirements by Module](#functional-requirements-by-module)
5. [Non-Functional Requirements](#non-functional-requirements)
6. [Use Cases](#use-cases)
7. [Business Rules](#business-rules)
8. [Constraints & Assumptions](#constraints--assumptions)
9. [Requirement Traceability Matrix](#requirement-traceability-matrix)

---

## Introduction

This document defines the functional and non-functional requirements for DashNode — a project management and team collaboration SPA targeting software development teams using Scrum methodology.

### Scope
DashNode covers: authentication, project management, backlog management (Epics/Stories/Tasks), sprint planning and execution, Kanban board, meeting management, team availability, issue tracking with AI analysis, knowledge base with approval workflow, DevOps pipeline visualization, AI interaction metrics, and team notifications.

### Out of Scope
- Real backend / API server
- Real-time collaboration (WebSocket)
- Email/SMS notifications
- Mobile native applications
- Billing or subscription management

### Requirements Notation
- **Priority:** Critical / High / Medium / Low
- **Status:** Implemented / Partial / Pending
- **Format:** As a `[role]`, I want `[capability]` so that `[benefit]`

---

## Stakeholders & Roles

| Role | Users | Permissions Level |
|------|-------|------------------|
| **Admin** | Andrey Quiceno | Full access to all features and all data |
| **Manager** | Jhorman Gómez, Valentina Restrepo | Project management, team oversight, approval workflows |
| **Developer** | Iván Ausecha, David Enciso, Carlos Montoya | Task execution, fixes, knowledge consumption |

### Role Hierarchy
```
Admin
  ├── Can do everything Manager can
  ├── Manage users (create, edit, deactivate)
  ├── Delete any project
  └── Override any business rule

Manager
  ├── Can do everything Developer can
  ├── Create/edit/archive projects
  ├── Approve knowledge entries
  ├── View all team metrics
  └── Manage sprints

Developer
  ├── View assigned projects
  ├── Manage own tasks
  ├── Report fixes
  ├── Consume approved knowledge
  └── Use AI assistant
```

---

## Functional Requirements by Module

---

### Module 1: Authentication

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| AUTH-01 | As any user, I want to log in with email and password so that I can access the system | All | Critical | Implemented |
| AUTH-02 | As any user, I want my session to persist across browser refreshes so that I don't have to log in repeatedly | All | High | Implemented |
| AUTH-03 | As any user, I want to log out securely so that my session is cleared | All | Critical | Implemented |
| AUTH-04 | As an admin, I want to reset any user's password so that locked-out users can regain access | Admin | High | Partial |
| AUTH-05 | As any user, I want to see a landing page before login so that I understand the product | All | Medium | Implemented |
| AUTH-06 | As the system, I want to redirect unauthenticated requests to login so that protected pages are not accessible | System | Critical | Implemented |

---

### Module 2: User Management

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| USR-01 | As an admin, I want to view all system users so that I can manage the team | Admin | Critical | Implemented |
| USR-02 | As an admin, I want to create new users with name, email, role, and password so that team members can join | Admin | Critical | Implemented |
| USR-03 | As an admin, I want to edit user information (name, email, role) so that profiles stay accurate | Admin | High | Implemented |
| USR-04 | As an admin, I want to deactivate users so that former team members lose access | Admin | High | Implemented |
| USR-05 | As any user, I want to edit my own profile (name, avatar) so that my identity is accurate | All | Medium | Implemented |
| USR-06 | As an admin, I want to filter and search users by role and name so that I can find specific team members | Admin | Medium | Implemented |

---

### Module 3: Projects

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| PRJ-01 | As an admin/manager, I want to create a project with name, description, priority, and tech stack so that work can be organized | Admin/Manager | Critical | Implemented |
| PRJ-02 | As an admin/manager, I want to assign a manager to each project so that accountability is clear | Admin/Manager | Critical | Implemented |
| PRJ-03 | As an admin/manager, I want to add team members to a project so that developers can access project work | Admin/Manager | High | Implemented |
| PRJ-04 | As any user, I want to see all projects I have access to so that I can navigate to my work | All | Critical | Implemented |
| PRJ-05 | As an admin/manager, I want to update project status (planning/active/on-hold/completed/cancelled) so that the project lifecycle is tracked | Admin/Manager | High | Implemented |
| PRJ-06 | As an admin, I want to delete projects so that abandoned projects are removed | Admin | Medium | Implemented |
| PRJ-07 | As any user, I want to see a project workspace with tabbed navigation so that all project tools are organized | All | High | Implemented |
| PRJ-08 | As any user, I want to see a project overview with KPIs (progress, velocity, open issues) so that I understand project health | All | High | Implemented |

---

### Module 4: Backlog Management

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| BKL-01 | As an admin/manager, I want to create Epics so that large features can be organized | Admin/Manager | Critical | Implemented |
| BKL-02 | As an admin/manager, I want to create User Stories within Epics so that development work is defined | Admin/Manager | Critical | Implemented |
| BKL-03 | As an admin/manager, I want to create Tasks within User Stories so that work is granular | Admin/Manager | Critical | Implemented |
| BKL-04 | As any user, I want to view the full backlog hierarchy (Epic → Story → Task) so that the work breakdown is clear | All | High | Implemented |
| BKL-05 | As an admin/manager, I want to assign story points to User Stories so that sprint capacity is estimated | Admin/Manager | High | Implemented |
| BKL-06 | As any user, I want to assign tasks to specific developers so that responsibility is clear | All | High | Implemented |
| BKL-07 | As any user, I want to set priority (critical/high/medium/low) on any entity so that important work is prioritized | All | High | Implemented |
| BKL-08 | As any user, I want to add tags to tasks so that work can be categorized | All | Medium | Implemented |
| BKL-09 | As an admin/manager, I want to move User Stories to a Sprint so that sprint scope is defined | Admin/Manager | Critical | Implemented |
| BKL-10 | As any user, I want to search and filter the backlog so that specific work items are easy to find | All | Medium | Implemented |

---

### Module 5: Sprint Management

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| SPR-01 | As an admin/manager, I want to create a sprint with name, goal, start/end dates so that a time-boxed iteration is defined | Admin/Manager | Critical | Implemented |
| SPR-02 | As an admin/manager, I want to start a sprint so that the team begins the iteration | Admin/Manager | Critical | Implemented |
| SPR-03 | As an admin/manager, I want to complete a sprint so that the iteration is formally closed | Admin/Manager | Critical | Implemented |
| SPR-04 | As any user, I want to see sprint velocity (story points completed) so that team performance is tracked | All | High | Implemented |
| SPR-05 | As any user, I want to see a burndown chart so that sprint progress is visualized | All | High | Implemented |
| SPR-06 | As any user, I want to see all sprints (planning, active, completed) so that sprint history is available | All | High | Implemented |
| SPR-07 | As the system, I want to enforce only one active sprint per project so that work focus is maintained | System | Critical | Implemented |
| SPR-08 | As an admin/manager, I want to cancel a sprint with a reason so that abandoned sprints are handled | Admin/Manager | Medium | Implemented |

---

### Module 6: Kanban Board

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| KAN-01 | As any user, I want to view tasks organized in Kanban columns (todo, in-progress, code-review, testing, fixing, completed) so that work status is visual | All | Critical | Implemented |
| KAN-02 | As any user, I want to move tasks between Kanban columns so that status is updated | All | Critical | Implemented |
| KAN-03 | As any user, I want to see task assignee, priority, and points on Kanban cards so that context is available at a glance | All | High | Implemented |
| KAN-04 | As any user, I want to filter Kanban cards by assignee, priority, or tags so that the board is navigable | All | Medium | Implemented |
| KAN-05 | As any user, I want to click a Kanban card to see full task detail so that more information is accessible | All | High | Implemented |
| KAN-06 | As any user, I want tasks in 'fixing' status to be visually distinguished so that blocked work is obvious | All | High | Implemented |

---

### Module 7: Meetings

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| MTG-01 | As an admin/manager, I want to schedule meetings with title, type, date/time, participants, and location so that ceremonies are organized | Admin/Manager | Critical | Implemented |
| MTG-02 | As any user, I want to view upcoming and past meetings in a list and calendar so that scheduling is managed | All | High | Implemented |
| MTG-03 | As the creator of a meeting, I want to cancel it so that the team is informed of cancellations | Meeting Creator | High | Implemented |
| MTG-04 | As an admin/manager, I want to add a summary and minutes URL after a meeting so that outcomes are documented | Admin/Manager | High | Implemented |
| MTG-05 | As any user, I want to accept or decline meeting invitations so that attendance is confirmed | All | Medium | Implemented |
| MTG-06 | As any user, I want to see meeting types (daily/planning/review/retro/general) so that ceremony types are clear | All | Medium | Implemented |
| MTG-07 | As the system, I want to restrict meeting cancellation to the creator only so that unauthorized cancellations are prevented | System | Critical | Implemented |

---

### Module 8: Availability

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| AVL-01 | As any user, I want to set my weekly availability by hour blocks so that scheduling is informed by real availability | All | High | Implemented |
| AVL-02 | As a manager/admin, I want to see the team's weekly availability grid so that I can schedule meetings with full attendance | Manager/Admin | High | Implemented |
| AVL-03 | As any user, I want my availability to persist week over week so that I don't have to re-enter it | All | Medium | Implemented |

---

### Module 9: Fixes (Issue Tracking)

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| FIX-01 | As any user, I want to report a fix/issue with title, description, severity, and type so that bugs are tracked | All | Critical | Implemented |
| FIX-02 | As any user, I want to attach evidence (screenshots, logs) to a fix so that reproduction is documented | All | High | Implemented |
| FIX-03 | As any user, I want to request AI analysis on a fix so that root cause suggestions are generated | All | High | Implemented |
| FIX-04 | As an admin/manager, I want to validate AI analysis before it is acted upon so that human oversight is maintained | Admin/Manager | Critical | Implemented |
| FIX-05 | As an admin/manager, I want to assign a fix to a developer so that responsibility is clear | Admin/Manager | High | Implemented |
| FIX-06 | As any user, I want to resolve a fix with a resolution note so that the fix history is complete | All | High | Implemented |
| FIX-07 | As any user, I want fixes to link to tasks (setting task status to 'fixing') so that Kanban reflects real blockers | All | High | Implemented |
| FIX-08 | As any user, I want to filter fixes by status, severity, and type so that issues are manageable | All | Medium | Implemented |

---

### Module 10: Knowledge Base

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| KB-01 | As any user, I want to create knowledge entries (docs, prompt logs, meeting notes) so that team knowledge is preserved | All | High | Implemented |
| KB-02 | As the system, I want new entries to require approval before being visible to developers so that quality is maintained | System | Critical | Implemented |
| KB-03 | As an admin/manager, I want to approve or reject knowledge entries with feedback so that the knowledge base is curated | Admin/Manager | Critical | Implemented |
| KB-04 | As any user, I want to search knowledge entries by title, content, or tags so that information is discoverable | All | High | Implemented |
| KB-05 | As any user, I want to filter knowledge by category (technical/functional/meeting/general/prompt) so that content type is navigable | All | Medium | Implemented |
| KB-06 | As the author, I want to revise rejected entries and resubmit for approval so that feedback can be incorporated | All | High | Implemented |
| KB-07 | As an admin/manager, I want to pin important entries so that key documents are featured | Admin/Manager | Low | Implemented |
| KB-08 | As the system, I want to prevent an author from approving their own entry so that conflicts of interest are avoided | System | Critical | Implemented |

---

### Module 11: DevOps

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| DEV-01 | As any user, I want to see a visual pipeline of CI/CD stages (lint, test, build, deploy) so that the delivery process is transparent | All | High | Implemented |
| DEV-02 | As any user, I want to see pipeline run history with status and duration so that deployment health is tracked | All | High | Implemented |
| DEV-03 | As any user, I want to see quality gate results (coverage, lint score) so that code quality is monitored | All | High | Implemented |
| DEV-04 | As any user, I want to see a Git Flow diagram showing branch relationships so that branching strategy is documented | All | Medium | Implemented |
| DEV-05 | As an admin/manager, I want to manually trigger a pipeline run so that deploys can be initiated on demand | Admin/Manager | Medium | Implemented |
| DEV-06 | As any user, I want to see pipeline step logs so that failures can be diagnosed | All | Medium | Implemented |

---

### Module 12: AI Assistant & Metrics

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| AI-01 | As any user, I want a floating AI assistant widget so that AI help is available from anywhere in the app | All | High | Implemented |
| AI-02 | As any user, I want the AI assistant to have context of my current project so that responses are relevant | All | High | Implemented |
| AI-03 | As an admin/manager, I want to see an AI metrics dashboard (total interactions, avg latency, token usage) so that AI usage is monitored | Admin/Manager | Medium | Implemented |
| AI-04 | As an admin/manager, I want to see AI interactions per user so that adoption is measured | Admin/Manager | Medium | Implemented |
| AI-05 | As any user, I want to rate AI responses (1–5) so that response quality is tracked | All | Low | Implemented |
| AI-06 | As the system, I want all AI-generated content to be logged so that there is an audit trail | System | High | Implemented |
| AI-07 | As the system, I want AI proposals to require human validation before automated action so that safety is maintained | System | Critical | Implemented |

---

### Module 13: Notifications

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| NOT-01 | As any user, I want to receive in-app notifications for relevant events (task assigned, sprint started, fix reported) so that I am informed | All | High | Implemented |
| NOT-02 | As any user, I want to see an unread notification count badge so that I notice new notifications | All | High | Implemented |
| NOT-03 | As any user, I want to mark notifications as read individually or in bulk so that the inbox is manageable | All | High | Implemented |
| NOT-04 | As any user, I want notifications to link to the relevant entity so that I can navigate directly | All | Medium | Implemented |
| NOT-05 | As any user, I want to clear all notifications so that the inbox can be reset | All | Low | Implemented |

---

### Module 14: Command Palette

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| CMD-01 | As any user, I want to open a command palette with Ctrl+K so that navigation and actions are keyboard-accessible | All | High | Implemented |
| CMD-02 | As any user, I want to search for pages and actions in the command palette so that any feature is reachable in 2 keystrokes | All | High | Implemented |
| CMD-03 | As any user, I want the command palette to show role-appropriate commands only so that irrelevant options are hidden | All | Medium | Implemented |
| CMD-04 | As any user, I want to dismiss the command palette with Escape so that it can be closed quickly | All | High | Implemented |

---

### Module 15: My Tasks

| ID | Requirement | Role | Priority | Status |
|----|-------------|------|----------|--------|
| TSK-01 | As any user, I want to see all tasks assigned to me across all projects so that I have a personal work view | All | High | Implemented |
| TSK-02 | As any user, I want to filter my tasks by status and project so that my work is organized | All | Medium | Implemented |
| TSK-03 | As any user, I want to update task status from My Tasks view so that I don't have to navigate to the project Kanban | All | Medium | Implemented |

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-P01 | Initial page load time | < 3 seconds on 4G connection | Implemented |
| NFR-P02 | Time-to-interactive | < 2 seconds | Implemented |
| NFR-P03 | State updates reflected in UI | < 100ms | Implemented |
| NFR-P04 | localStorage read/write operations | < 50ms | Implemented |
| NFR-P05 | Command palette response to keystroke | < 50ms | Implemented |

### Usability

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-U01 | Role-appropriate UI — users see only relevant features | Enforced at component level | Implemented |
| NFR-U02 | Responsive layout supporting 1280px–1920px screens | Implemented | Implemented |
| NFR-U03 | All primary actions reachable within 3 clicks | Enforced by design | Implemented |
| NFR-U04 | Empty states with actionable prompts | Implemented in all modules | Implemented |
| NFR-U05 | Keyboard navigation for command palette | Implemented | Implemented |
| NFR-U06 | Visual feedback for all user actions (loading, success, error) | Implemented | Implemented |

### Reliability

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-R01 | Application must not crash on corrupted localStorage | Graceful fallback to seed data | Implemented |
| NFR-R02 | Error boundaries prevent cascade failures | Per-module boundaries | Implemented |
| NFR-R03 | All form inputs validated before submission | Client-side validation | Implemented |

### Security (for SPA context)

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-S01 | No sensitive credentials stored in plain localStorage | Passwords are never stored | Implemented |
| NFR-S02 | Role checks enforced on every protected action | Guard clauses in reducers | Implemented |
| NFR-S03 | XSS prevention via React's default escaping | React DOM handles this | Implemented |

### Maintainability

| ID | Requirement | Target | Status |
|----|-------------|--------|--------|
| NFR-M01 | All components typed with TypeScript | 100% TypeScript | Implemented |
| NFR-M02 | No `any` types in production code | ESLint rule enforced | Implemented |
| NFR-M03 | Component files under 300 lines | Enforced by convention | Implemented |
| NFR-M04 | Shared components documented with prop types | JSDoc + TypeScript | Implemented |

---

## Use Cases

### UC-01: Developer Reports a Fix from Kanban

**Actor:** Developer (Iván Ausecha)  
**Precondition:** Task exists in 'testing' status  
**Flow:**
1. Developer sees a bug during testing
2. Developer opens the task on Kanban and selects "Report Fix"
3. System prompts for fix title, description, severity, type
4. Developer fills form and submits
5. System creates Fix entity, links it to the task
6. System updates task status to 'fixing'
7. System notifies project manager
8. Developer optionally uploads evidence (screenshot, log)
9. Developer optionally requests AI analysis
10. Manager validates AI analysis before taking action

**Postcondition:** Fix is created, task shows 'fixing' status on Kanban

---

### UC-02: Manager Conducts Sprint Planning

**Actor:** Manager (Jhorman Gómez)  
**Precondition:** Project has backlog stories; no sprint is active  
**Flow:**
1. Manager navigates to Sprints tab
2. Manager creates a new sprint with goal and dates
3. Manager opens planning view showing backlog stories
4. Manager drags stories from backlog to sprint
5. System calculates total story points for sprint
6. Manager confirms sprint and starts it
7. System activates the sprint, notifications sent to team
8. Kanban board now shows sprint tasks

**Postcondition:** Sprint is active; stories are in sprint scope; team is notified

---

### UC-03: Knowledge Entry Approval Workflow

**Actor:** Developer (David Enciso) submits; Manager (Valentina Restrepo) reviews  
**Precondition:** None  
**Flow:**
1. Developer writes a knowledge entry (category: 'technical')
2. Developer submits the entry
3. System saves entry with `approval_status: 'pending'`
4. Manager sees the entry in the Approval Queue
5. Manager reviews the content
6. Manager clicks Approve (or Reject with reason)
7. If approved: entry is now visible to all team members
8. If rejected: developer receives notification with rejection reason
9. Developer edits and resubmits if rejected

**Postcondition:** Entry is 'approved' and searchable by all, or 'rejected' with feedback

---

### UC-04: Admin Manages Users

**Actor:** Admin (Andrey Quiceno)  
**Precondition:** Admin is logged in  
**Flow:**
1. Admin navigates to Users page
2. Admin sees list of all users with role and status filters
3. Admin creates a new user (name, email, role, temporary password)
4. User appears in the list
5. Admin can edit a user's role or name
6. Admin can deactivate a user (soft delete)

**Postcondition:** User is created/modified/deactivated; changes persist to localStorage

---

## Business Rules

### BR-01: Sprint Uniqueness
Only one sprint per project may have status `'active'` at any given time. The system must prevent starting a second sprint if one is already active.

### BR-02: Meeting Cancellation
Only the user who created a meeting (`creator_id`) may cancel it. This applies regardless of role — even an admin cannot cancel a meeting created by a manager unless the admin is the creator.

### BR-03: AI Human Validation
All AI-generated analyses (`AIAnalysis`) must have `human_validated = true` before any automated action is performed. The system must display a validation prompt when AI proposals are generated.

### BR-04: Knowledge Self-Approval
A user may not approve their own knowledge entry. The system must verify that `approved_by != author_id` before processing approval.

### BR-05: Fix-Task Status Coupling
When a Task is linked to a Fix (`task.fix_id != null`), the task status must be `'fixing'`. When a Fix is resolved or closed, the system must remove the task's `fix_id` and revert the status to the previous state or allow the user to set a new status.

### BR-06: Role-Based Data Access
- Developers see only: their assigned projects, their own tasks, approved knowledge entries
- Managers see: all projects they manage, all team tasks in those projects, pending knowledge entries
- Admins see: everything

### BR-07: Story Points Fibonacci
User story points must be from the Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21. The system enforces this via a constrained select input.

---

## Constraints & Assumptions

### Technical Constraints
- Application must run without a backend server
- All data must persist in `localStorage` for the demo
- No real network calls to external services
- Must build as a single HTML bundle (Vite SPA build)

### Assumptions
- Users have modern browsers (Chrome 120+, Firefox 120+, Safari 17+)
- Screen resolution minimum 1280×720
- JavaScript is enabled
- 5MB localStorage is sufficient for demo data
- The AI assistant responses are simulated (no real Anthropic API key required for demo)

---

## Requirement Traceability Matrix

| Requirement ID | Module | Component(s) | Status |
|---------------|--------|-------------|--------|
| AUTH-01 | Authentication | `LoginPage`, `AuthContext` | Implemented |
| PRJ-01 | Projects | `ProjectsPage`, `CreateProjectModal` | Implemented |
| BKL-01–10 | Backlog | `BacklogTab`, `EpicList`, `StoryList`, `TaskList` | Implemented |
| SPR-01–08 | Sprints | `SprintsTab`, `SprintCard`, `SprintPlanning` | Implemented |
| KAN-01–06 | Kanban | `KanbanTab`, `KanbanColumn`, `KanbanCard` | Implemented |
| MTG-01–07 | Meetings | `MeetingsPage`, `MeetingsTab`, `MeetingModal` | Implemented |
| FIX-01–08 | Fixes | `FixesTab`, `FixCard`, `EvidenceUpload`, `AIAnalysisPanel` | Implemented |
| KB-01–08 | Knowledge | `KnowledgeTab`, `KnowledgeList`, `ApprovalQueue` | Implemented |
| DEV-01–06 | DevOps | `DevOpsTab`, `PipelineVisualizer`, `GitFlowDiagram` | Implemented |
| AI-01–07 | AI | `AIFloatingWidget`, `AIMetricsTab` | Implemented |
| NOT-01–05 | Notifications | `NotificationPanel`, `NotificationBell` | Implemented |
| CMD-01–04 | Command Palette | `CommandPalette` | Implemented |
