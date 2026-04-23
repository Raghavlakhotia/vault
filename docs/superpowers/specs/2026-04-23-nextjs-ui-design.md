# Vault — Next.js UI Design Spec

**Date:** 2026-04-23
**Status:** Approved

---

## Overview

A Next.js 14 frontend for the Vault budget manager. The app is used by two people (Husband and Wife) to track shared household expenses and budgets by month. It connects directly to the existing FastAPI backend running at `http://localhost:8000`.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| API | Direct client-side fetch to FastAPI (`http://localhost:8000`) |
| State | React `useState` / `useEffect` — no external state library |
| Font | Inter (system-ui fallback) |

No Next.js API route proxy. CORS is open on the FastAPI backend (`allow_origins=["*"]`), so the browser fetches directly.

---

## Design System

### Colors

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#0f1117` | Page background |
| `bg-nav` | `#13161f` | Top nav, table headers |
| `bg-panel` | `#1a1d27` | Cards, panels, table body |
| `border` | `rgba(255,255,255,.07)` | All borders |
| `accent` | `#6366f1` / `#818cf8` | Indigo — active nav, badges, buttons |
| `success` | `#22c55e` | Healthy budget |
| `warning` | `#f59e0b` | ≥80% of budget used |
| `danger` | `#f87171` | Over budget |
| `text-primary` | `#e4e6f0` | Main text |
| `text-secondary` | `#9ca3af` | Secondary text |
| `text-muted` | `#6b7280` | Labels, metadata |

### Paid-By Tags

- **Husband** → indigo badge (`#818cf8` on `rgba(99,102,241,.15)`)
- **Wife** → pink badge (`#f472b6` on `rgba(236,72,153,.12)`)

### Budget % Color Rules

- `< 80%` → green (healthy)
- `80–99%` → amber (warning)
- `≥ 100%` → red (over budget)

---

## Global Layout

### Top Navigation

Persistent across all pages. Contains:
- **VAULT** brand (indigo, left)
- Four nav links: **Dashboard · Expenses · Budgets · Categories**
- **‹ Apr 2026 ›** month switcher (right) — shared across all pages via URL search param (`?month=2026-04`). Navigating between tabs preserves the selected month. Defaults to the current month on first load.

Active link gets an indigo pill background. Inactive links are muted gray.

---

## Pages

### 1. Dashboard (`/`)

**Data source:** `GET /api/dashboard/{month}`

Returns: `{ month, matrix: DashboardRow[], totals: DashboardRow, expenses: ExpenseOut[] }`

#### Stat Cards (top row, 4 cards)

| Card | Value | Color |
|---|---|---|
| Monthly Budget | `totals.monthly_budget` | neutral |
| Cumulative Budget | `totals.cumulative` | indigo |
| Total Spent | `totals.spent` | danger |
| Free Limit Left | `totals.remaining` | success |

#### Budget Table (full width)

Columns:

| Column | Source field | Notes |
|---|---|---|
| Category | `row.category` | Left-aligned |
| Monthly Budget | `row.monthly_budget` | Right-aligned, ₹ formatted |
| Cumulative Budget | `row.cumulative` | Right-aligned, ₹ formatted |
| Total Expense | `row.spent` | Right-aligned, ₹ formatted |
| % Expense | `row.pct_used` | Badge, color-coded by % rules |
| Monthly Limit Left | `row.monthly_budget - row.spent` | Computed client-side, color-coded |
| Free Limit | `row.remaining` | Right-aligned, color-coded |

- Negative values display as `−₹X` in red.
- A **Totals row** (highlighted indigo) uses `totals` from the API response.
- Rows sorted by category name alphabetically.

#### Bottom Section (two columns)

**Left — At-a-glance summary panel:**
Rendered from the matrix data. Calls out:
- Categories that are over budget (red)
- Categories approaching limit (amber, ≥80%)
- Category with most headroom (green)

**Right — Recent Expenses feed (last 5):**
- Each item: emoji icon · description · category tag · Husband/Wife tag · amount · date
- "View all →" link navigates to `/expenses`
- **+ Add Expense** button at the bottom opens the Add Expense drawer

---

### 2. Expenses (`/expenses`)

**Data sources:**
- List: `GET /api/expenses/?month=YYYY-MM`
- Create: `POST /api/expenses/`
- Delete: `DELETE /api/expenses/{id}`

#### Filters (top bar)

- Month comes from the global month switcher
- **Paid By toggle:** All · Husband · Wife (client-side filter on the fetched list)

#### Expense Table

Columns: **Date · Category · Description · Paid By · Amount · (Delete)**

- Date formatted as `DD MMM` (e.g. `22 Apr`)
- Paid By shown as colored tag (Husband/Wife)
- Delete: small trash icon button, confirms inline (row highlights red briefly, then removes)
- Sorted by date descending

#### Add Expense Drawer

Triggered by **+ Add Expense** button (top-right and on Dashboard). Slides in from the right.

Fields:
| Field | Input | Notes |
|---|---|---|
| Amount | Number input | Required, positive |
| Category | Dropdown | Fetched from `GET /api/categories/` |
| Description | Text input | Optional |
| Paid By | Dropdown | Fixed: Husband / Wife |
| Date | Date picker | Defaults to today |

On submit: `POST /api/expenses/` → closes drawer → refreshes expense list and dashboard data.

---

### 3. Budgets (`/budgets`)

**Data sources:**
- Fetch: `GET /api/budgets/{month}`
- Save: `PUT /api/budgets/{month}` with `{ entries: [{ category, amount }] }`

#### Layout

- Month comes from the global month switcher
- Editable table: **Category · Monthly Budget** (number input per row)
- All inputs editable simultaneously
- Single **Save** button at the bottom → sends a single batch `PUT` with all entries
- On save success: show a brief success toast

Note: categories are fetched from `GET /api/categories/` to populate rows. Categories with no budget set show an empty input (treated as 0 / unset).

---

### 4. Categories (`/categories`)

**Data sources:**
- List: `GET /api/categories/`
- Create: `POST /api/categories/`
- Delete: `DELETE /api/categories/{name}`

#### Layout

- **Add Category** text input + **Add** button at top → `POST /api/categories/`
- List of existing categories, each with a **Delete** (trash icon) button
- Deletion is immediate (no confirm dialog — categories are just strings and recoverable)
- Empty state: "No categories yet. Add one above."

---

## API Integration

Base URL: `http://localhost:8000` (hardcoded for local dev; move to `NEXT_PUBLIC_API_URL` env var).

All fetches are client-side (`"use client"` components). Error states show an inline error message. Loading states show a skeleton placeholder.

### Endpoints Used

| Page | Method | Endpoint |
|---|---|---|
| Dashboard | GET | `/api/dashboard/{month}` |
| Expenses | GET | `/api/expenses/?month=YYYY-MM` |
| Expenses | POST | `/api/expenses/` |
| Expenses | DELETE | `/api/expenses/{id}` |
| Budgets | GET | `/api/budgets/{month}` |
| Budgets | PUT | `/api/budgets/{month}` |
| Categories | GET | `/api/categories/` |
| Categories | POST | `/api/categories/` |
| Categories | DELETE | `/api/categories/{name}` |

---

## File Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with nav + month context
│   ├── page.tsx            # Dashboard
│   ├── expenses/
│   │   └── page.tsx
│   ├── budgets/
│   │   └── page.tsx
│   └── categories/
│       └── page.tsx
├── components/
│   ├── Nav.tsx             # Top navigation + month switcher
│   ├── StatCard.tsx        # Summary stat card
│   ├── BudgetTable.tsx     # Dashboard budget matrix table
│   ├── ExpenseFeed.tsx     # Recent expenses panel
│   ├── ExpenseTable.tsx    # Full expense list
│   ├── AddExpenseDrawer.tsx# Slide-in add expense form
│   ├── BudgetEditor.tsx    # Editable budget table
│   └── CategoryManager.tsx # Category list + add/delete
└── lib/
    └── api.ts              # Typed fetch wrappers for all endpoints
```

---

## Out of Scope

- Authentication / login
- Charts or graphs (table-first per user preference)
- Edit expense (backend has no PATCH — delete and re-add)
- Multi-month budget copy/paste
- Mobile responsive design (desktop-first for now)
