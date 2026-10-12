# Architecture Document — DashNode

**Version:** 1.0  
**Date:** 2026-09-30  
**Authors:** DashNode Engineering Team  

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Style](#architecture-style)
3. [Component Tree](#component-tree)
4. [State Management](#state-management)
5. [Routing & Navigation](#routing--navigation)
6. [Data Flow](#data-flow)
7. [Persistence Layer](#persistence-layer)
8. [Module Breakdown](#module-breakdown)
9. [Cross-Cutting Concerns](#cross-cutting-concerns)
10. [Scalability Considerations](#scalability-considerations)
11. [Future Migration Path](#future-migration-path)
12. [Diagrams](#diagrams)

---

## System Overview

DashNode is a **fully client-side Single Page Application (SPA)** for managing software projects using Scrum methodology. It requires no server-side runtime — all business logic, data storage, and rendering happen in the user's browser.

**Technology Foundation:**
- React 19 with functional components and hooks
- TypeScript 5.7 for full type safety
- Tailwind CSS v4 for styling (no config file)
- Vite 8 as bundler and dev server
- `localStorage` for data persistence

**Deployment Model:**
```
Browser (SPA)
    ├── All UI rendering (React)
    ├── All business logic (TypeScript)
    ├── All state management (useReducer + Context)
    └── All persistence (localStorage)

No network required after initial load (offline-capable)
```

---

## Architecture Style

### Pattern: Modular Feature-Based SPA

DashNode follows a **feature-sliced architecture** adapted for React SPA conventions:

```
src/
├── components/       # Shared/reusable UI atoms and molecules
├── context/          # React Context providers (global state)
├── hooks/            # Custom React hooks
├── pages/            # Top-level page components (route targets)
├── types/            # TypeScript type definitions
├── utils/            # Pure utility functions
└── data/             # Seed data and initial state
```

### Architectural Characteristics

| Characteristic | Approach |
|---------------|----------|
| State management | useReducer + React Context (no Redux) |
| Routing | State-based (NavState enum, no React Router) |
| Persistence | JSON serialization to localStorage |
| Styling | Tailwind CSS v4 utility classes |
| Icons | lucide-react (tree-shakeable) |
| API calls | None (fully client-side) |
| Auth | Simulated (localStorage session) |
| Testing | Unit tests for utils and reducers |

---

## Component Tree

### High-Level Structure

```
index.html
└── #root
    └── <App />
        ├── <AppContextProvider />   (global state)
        │   ├── AuthContext
        │   ├── ProjectContext
        │   ├── TaskContext
        │   ├── NotificationContext
        │   └── UIContext
        └── <AppShell />
            ├── <LandingPage />        (unauthenticated)
            ├── <LoginPage />          (unauthenticated)
            └── <AuthenticatedLayout /> (authenticated)
                ├── <Sidebar />
                │   ├── <NavItem /> × N
                │   ├── <UserAvatar />
                │   └── <NotificationBell />
                ├── <CommandPalette />  (Ctrl+K, global overlay)
                ├── <AIFloatingWidget /> (bottom-right, global overlay)
                ├── <NotificationPanel /> (side panel overlay)
                └── <MainContent />
                    ├── <DashboardPage />
                    ├── <UsersPage />
                    ├── <ProjectsPage />
                    ├── <ProjectWorkspacePage />
                    │   ├── <ProjectHeader />
                    │   ├── <ProjectTabBar />
                    │   └── <TabContent />
                    │       ├── <OverviewTab />
                    │       ├── <TeamTab />
                    │       ├── <BacklogTab />
                    │       │   ├── <EpicList />
                    │       │   ├── <UserStoryList />
                    │       │   └── <TaskList />
                    │       ├── <SprintsTab />
                    │       │   ├── <SprintCard />
                    │       │   └── <SprintPlanning />
                    │       ├── <KanbanTab />
                    │       │   ├── <KanbanColumn /> × 6
                    │       │   └── <KanbanCard />
                    │       ├── <MeetingsTab />
                    │       ├── <DocsTab />
                    │       ├── <MetricsTab />
                    │       ├── <FixesTab />
                    │       │   ├── <FixCard />
                    │       │   ├── <EvidenceUpload />
                    │       │   └── <AIAnalysisPanel />
                    │       ├── <KnowledgeTab />
                    │       │   ├── <KnowledgeList />
                    │       │   └── <ApprovalQueue />
                    │       ├── <DevOpsTab />
                    │       │   ├── <PipelineVisualizer />
                    │       │   └── <GitFlowDiagram />
                    │       └── <AIMetricsTab />
                    ├── <MeetingsPage />
                    ├── <AvailabilityPage />
                    ├── <CalendarPage />
                    ├── <ProfilePage />
                    ├── <MyTasksPage />
                    └── <UserManualPage />
```

### Component Responsibility Layers

| Layer | Examples | Responsibility |
|-------|----------|---------------|
| Pages | `DashboardPage`, `ProjectWorkspacePage` | Route targets, data orchestration |
| Feature Sections | `BacklogTab`, `KanbanTab`, `FixesTab` | Feature-specific logic and layout |
| Composite Components | `SprintCard`, `KanbanColumn`, `FixCard` | Domain-specific display + local state |
| Shared Components | `Button`, `Modal`, `Badge`, `Input` | Reusable UI atoms with no domain logic |
| Overlay Components | `CommandPalette`, `AIFloatingWidget` | Global overlays mounted at app root |

---

## State Management

### Architecture: Context + useReducer

DashNode uses React's built-in state primitives rather than a third-party state management library. Each domain has its own context with a typed reducer.

```typescript
// Pattern used across all contexts
const [state, dispatch] = useReducer(reducer, initialState);
const value = useMemo(() => ({ state, dispatch }), [state]);
return <Context.Provider value={value}>{children}</Context.Provider>;
```

### Context Map

| Context | State Shape | Key Actions |
|---------|-------------|-------------|
| `AuthContext` | `{ currentUser, isAuthenticated }` | `LOGIN`, `LOGOUT`, `UPDATE_PROFILE` |
| `ProjectContext` | `{ projects, selectedProject }` | `CREATE_PROJECT`, `UPDATE_PROJECT`, `DELETE_PROJECT`, `SELECT_PROJECT` |
| `TaskContext` | `{ epics, stories, tasks, sprints }` | `CREATE_TASK`, `UPDATE_TASK_STATUS`, `MOVE_TASK`, `CREATE_SPRINT` |
| `MeetingContext` | `{ meetings, availability }` | `CREATE_MEETING`, `CANCEL_MEETING`, `SET_AVAILABILITY` |
| `FixContext` | `{ fixes, evidence, analyses }` | `CREATE_FIX`, `ADD_EVIDENCE`, `REQUEST_AI_ANALYSIS`, `RESOLVE_FIX` |
| `KnowledgeContext` | `{ entries }` | `CREATE_ENTRY`, `APPROVE_ENTRY`, `REJECT_ENTRY` |
| `DevOpsContext` | `{ pipelines, branches }` | `TRIGGER_PIPELINE`, `UPDATE_STEP_STATUS` |
| `NotificationContext` | `{ notifications }` | `ADD_NOTIFICATION`, `MARK_READ`, `CLEAR_ALL` |
| `AIContext` | `{ interactions, isWidgetOpen }` | `LOG_INTERACTION`, `TOGGLE_WIDGET` |
| `UIContext` | `{ navState, commandPaletteOpen, theme }` | `NAVIGATE`, `TOGGLE_COMMAND_PALETTE` |

### Reducer Pattern

```typescript
// Example: Task reducer (simplified)
type TaskAction =
  | { type: 'CREATE_TASK'; payload: Task }
  | { type: 'UPDATE_TASK_STATUS'; payload: { id: string; status: TaskStatus } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'MOVE_TO_SPRINT'; payload: { taskId: string; sprintId: string } };

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'CREATE_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK_STATUS':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.id ? { ...t, status: action.payload.status } : t
        )
      };
    // ...
  }
}
```

### State Initialization

1. On app load, each context reads from `localStorage`
2. If no data found, seeds with initial demo data
3. Every state mutation persists the new state to `localStorage` via a `useEffect` listener

```typescript
// localStorage sync pattern
useEffect(() => {
  localStorage.setItem('dashnode_tasks', JSON.stringify(state.tasks));
}, [state.tasks]);
```

---

## Routing & Navigation

### State-Based Navigation (No React Router)

DashNode uses a custom navigation system based on a `NavState` discriminated union type rather than URL-based routing. This decision was made for:
- Simplified deployment (no need to configure server-side fallbacks)
- Tighter integration with app state
- Easier state passing between "routes"

```typescript
type NavState =
  | { page: 'landing' }
  | { page: 'login' }
  | { page: 'dashboard' }
  | { page: 'users' }
  | { page: 'projects' }
  | { page: 'project-workspace'; projectId: string; tab?: ProjectTab }
  | { page: 'meetings' }
  | { page: 'availability' }
  | { page: 'calendar' }
  | { page: 'profile' }
  | { page: 'my-tasks' }
  | { page: 'user-manual' };

type ProjectTab = 
  | 'overview' | 'team' | 'backlog' | 'sprints' | 'kanban'
  | 'meetings' | 'docs' | 'metrics' | 'fixes' | 'knowledge'
  | 'devops' | 'ai-metrics';
```

### Navigation Flow

```
AppShell renders based on navState.page:
  'landing'           → <LandingPage />
  'login'             → <LoginPage />
  'dashboard'         → <DashboardPage />
  'project-workspace' → <ProjectWorkspacePage projectId={...} tab={...} />
  ...etc
```

### Navigation from Components

```typescript
// Triggering navigation
const { dispatch } = useContext(UIContext);
dispatch({ type: 'NAVIGATE', payload: { page: 'project-workspace', projectId: 'proj-1', tab: 'kanban' } });
```

### Deep Linking Limitation

Since navigation is state-based (not URL-based), browser back/forward and bookmarks are not supported. The app always starts at the `landing` or `dashboard` page on load. This is a known limitation documented in the future migration path.

---

## Data Flow

### Unidirectional Data Flow

```
User Action (click, form submit)
    │
    ▼
Component dispatches Action
    │
    ▼
Reducer processes Action → new State
    │
    ├──▶ localStorage (persistence side effect via useEffect)
    │
    └──▶ React re-renders affected components
             │
             ▼
          Updated UI
```

### Cross-Context Communication

When an action in one context needs to affect another:

```
User creates a Fix from a Task:
    FixContext.dispatch(CREATE_FIX)
        ├── Fix is created in FixContext
        ├── TaskContext.dispatch(UPDATE_TASK_STATUS { status: 'fixing', fix_id })
        └── NotificationContext.dispatch(ADD_NOTIFICATION { type: 'fix_reported' })
```

This is handled via a custom `useAppActions` hook that holds references to multiple dispatchers and orchestrates multi-context operations.

### AI Widget Data Flow

```
User types in AI Widget
    │
    ▼
Simulated API call (setTimeout)
    │
    ▼
Response returned (mocked)
    │
    ├──▶ AIContext.dispatch(LOG_INTERACTION)
    └──▶ Widget displays response
```

---

## Persistence Layer

### localStorage Architecture

All data is stored as JSON arrays. The persistence layer consists of:

1. **Initial seed:** Hard-coded demo data in `src/data/seed.ts`
2. **Read on init:** Each context's `initialState` function reads from localStorage
3. **Write on change:** `useEffect` listeners persist state changes

```typescript
// Read pattern (in context initialization)
function getInitialState(): TaskState {
  try {
    const stored = localStorage.getItem('dashnode_tasks');
    return stored ? JSON.parse(stored) : { tasks: seedTasks };
  } catch {
    return { tasks: seedTasks };
  }
}

// Write pattern (in context provider)
useEffect(() => {
  localStorage.setItem('dashnode_tasks', JSON.stringify(state.tasks));
}, [state.tasks]);
```

### Data Size Considerations

`localStorage` has a 5–10 MB limit depending on browser. For the demo scale of DashNode (< 100 projects, < 1000 tasks), this is adequate. For production scale, a real database is required.

### Data Integrity

- No referential integrity enforcement at storage level
- Application layer enforces relationships via guards in reducers
- Cascade deletes are handled explicitly in reducer logic

---

## Module Breakdown

### Dashboard Module
- **Purpose:** Role-aware KPI overview
- **Components:** `StatCard`, `RecentActivityFeed`, `ProjectSummaryList`, `SprintBurndown`
- **Data sources:** Aggregated from all contexts on render
- **Role differences:** Admin sees all projects/users; Manager sees their projects; Developer sees their tasks

### Backlog Module
- **Purpose:** Hierarchical work breakdown (Epic → Story → Task)
- **Components:** `EpicAccordion`, `StoryRow`, `TaskInlineEditor`
- **Interactions:** Drag-to-reorder, inline editing, sprint assignment

### Kanban Module
- **Purpose:** Visual task status management
- **Columns:** todo → in-progress → code-review → testing → fixing → completed
- **Interactions:** Drag-and-drop between columns triggers `UPDATE_TASK_STATUS`

### Fixes Module
- **Purpose:** Issue tracking with evidence and AI analysis
- **Flow:** Report Fix → Add Evidence → Request AI Analysis → Human Validates → Resolve
- **AI integration:** Simulated `claude-3-5-sonnet` analysis with confidence scoring

### Knowledge Base Module
- **Purpose:** Team knowledge sharing with approval workflow
- **Flow:** Author creates draft → Manager/Admin approves → Developers can read
- **Search:** Client-side full-text search over title, content, tags (RAG simulation)

### DevOps Module
- **Purpose:** CI/CD pipeline visualization and Git Flow display
- **Components:** `PipelineCard`, `StepNode`, `GitFlowGraph`
- **Data:** Simulated pipeline runs with realistic step timing

### AI Metrics Module
- **Purpose:** Log and analyze all AI interactions
- **Metrics:** Total interactions, avg latency, token usage, rating distribution, per-user breakdown

---

## Cross-Cutting Concerns

### Authentication Guard

```typescript
// In AppShell
if (!isAuthenticated && navState.page !== 'landing' && navState.page !== 'login') {
  dispatch({ type: 'NAVIGATE', payload: { page: 'landing' } });
  return null;
}
```

### Role-Based Rendering

```typescript
// Conditional rendering based on role
const canManage = currentUser.role === 'admin' || currentUser.role === 'manager';
return canManage ? <AdminControls /> : null;
```

### Command Palette (Ctrl+K)

Global keyboard shortcut handler mounted in `App.tsx`:
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      dispatch({ type: 'TOGGLE_COMMAND_PALETTE' });
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

### Error Boundaries

Each major section is wrapped in a React `ErrorBoundary` to prevent cascade failures.

### Notification System

Notifications are generated by:
1. Direct dispatch from action handlers
2. A `useNotifier` hook that monitors state changes and auto-generates notifications

---

## Scalability Considerations

### Current Limitations

| Limitation | Impact | Severity |
|-----------|--------|----------|
| localStorage only | 5–10 MB limit, single device, no sync | High |
| No real auth | Security is simulated only | High |
| Client-side search | No full-text indexing, slow at scale | Medium |
| No offline sync | Cannot merge changes from multiple tabs | Medium |
| No pagination | All entities loaded into memory | Low (demo scale) |

### Performance Optimizations Applied

- `useMemo` for derived state (filtered lists, aggregated KPIs)
- `useCallback` for event handlers passed to lists
- Lazy rendering for large lists (virtual scroll not yet implemented)
- Icon tree-shaking via named imports from `lucide-react`

---

## Future Migration Path

### Phase 1: Add Real Backend (3 months)
```
Current: localStorage → Target: REST API + PostgreSQL

Steps:
1. Create a thin API service layer (src/services/)
2. Replace localStorage reads with API calls (GET /projects, etc.)
3. Replace localStorage writes with API mutations (POST, PATCH, DELETE)
4. Add JWT authentication with refresh tokens
5. Context reducers remain unchanged — only data-fetching changes
```

### Phase 2: Add Real-Time (1 month)
```
Add WebSocket or Server-Sent Events for:
- Live Kanban updates (multi-user drag-and-drop)
- Real-time notifications
- Pipeline status streaming
```

### Phase 3: Add URL Routing (2 weeks)
```
Replace NavState with React Router v7:
- Each NavState maps to a URL path
- Deep linking and browser history support
- Shareable links per project/sprint/task
```

### Phase 4: Add Real AI Integration (1 month)
```
Replace simulated AI with real Anthropic API:
- AI Widget → Claude API (claude-3-5-sonnet)
- Fix Analysis → Structured output with tool use
- Knowledge RAG → Embeddings + vector search (pgvector)
```

---

## Diagrams

### System Context Diagram

```
┌─────────────────────────────────────────────────────┐
│                     Browser                          │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │              DashNode SPA                     │   │
│  │                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │  React   │  │TypeScript│  │Tailwind  │   │   │
│  │  │  19 UI   │  │Business  │  │CSS v4    │   │   │
│  │  │          │  │  Logic   │  │Styling   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘   │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐   │   │
│  │  │         localStorage                  │   │   │
│  │  │  (all entities stored as JSON)        │   │   │
│  │  └──────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

No external services. No network calls required.
```

### State Management Flow

```
┌─────────────────────────────────────────────┐
│               React Component               │
│                                             │
│   1. Reads state via useContext()           │
│   2. Dispatches actions on user events      │
└────────────────────┬────────────────────────┘
                     │ dispatch(action)
                     ▼
┌─────────────────────────────────────────────┐
│               useReducer                    │
│                                             │
│   action → pure function → new state        │
└────────────────────┬────────────────────────┘
                     │ new state
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────┐   ┌─────────────────────┐
│  Context.value  │   │    useEffect        │
│  triggers re-   │   │    persists to      │
│  render         │   │    localStorage     │
└─────────────────┘   └─────────────────────┘
```

### Component Communication Patterns

```
Parent → Child:    Props
Child → Parent:    Callback props
Sibling → Sibling: Via shared Context
Global events:     Context + dispatch
Side effects:      useEffect in providers
```
