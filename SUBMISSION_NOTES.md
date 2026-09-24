# Submission Notes — NexGensis Product Admin Console

This document outlines the architectural decisions, problem-solving approaches, trade-off evaluations, and engineering methodologies employed while building the **NexGensis Product Admin Dashboard**.

---

## 1. Core Architectural Decisions

### A. Shared Axios Client with Request & Response Interceptors
- **Decision:** Centered all HTTP operations in `lib/api/axiosClient.ts`. No inline `fetch()` or disparate `axios.create()` instances exist in components.
- **Why:** 
  1. **Automatic Auth Attachment:** Outgoing requests automatically inject the `Authorization: Bearer <token>` header from session storage via a request interceptor.
  2. **Normalized Error Handling:** Response interceptors catch network dropouts, 4xx/5xx responses, and timeout errors, normalizing them into a predictable `ApiError` interface (`{ message, status, raw }`).
  3. **Separation of UI and Transport:** Toasts and visual feedback are *deliberately excluded* from the interceptor itself, empowering individual caller components to determine their own specific UI treatment (e.g. inline retry card vs. floating toast).

### B. Route Protection with Next.js Edge Middleware
- **Decision:** Protected routes (`/products`, `/dashboard`, `/products/*`) are guarded at the server level via `middleware.ts`.
- **Why:** Inspecting session cookies before rendering prevents unauthenticated UI flickering (FOUC) and securely redirects guests to `/login?redirect=...`. Authenticated members visiting `/login` are automatically redirected to `/products`.

### C. URL-First State Architecture
- **Decision:** Pagination (`page`, `pageSize`), keyword search (`q`), category filters (`category`), and sort preferences (`sortBy`, `order`) are synced bidirectionally with URL query parameters.
- **Why:** 
  1. Guarantees that refreshing the page, navigating back/forward via browser history, or sharing a link with a teammate reproduces the exact same filtered, paginated catalog slice.
  2. Input sanitizers in `lib/utils/pagination.ts` defensively guard against corrupted or out-of-bounds URL inputs (e.g., non-numeric strings or `?page=99999` automatically clamp to valid ranges).

---

## 2. A Real Problem Encountered & The Solution

### The Challenge: Out-of-Order Race Conditions During Fast Typing
- **Problem:** When a user types quickly into a search box, multiple async HTTP requests are fired in rapid succession (e.g. keystroke "p", then "ph", then "pho", then "phone"). Due to network variability or server latency (testable with DummyJSON's simulated `&delay=2000` parameter), the response for "ph" could arrive *after* the response for "phone", overwriting the UI with stale, incorrect search results.
- **Solution:** 
  1. **Debounce (400ms):** Reduces unnecessary network chatter by waiting until user typing settles.
  2. **AbortController Socket Cancellation:** Whenever a new query is initiated, the previous `AbortController` signal is triggered, terminating the pending HTTP connection.
  3. **Monotonic Request ID Guard (`requestIdRef`):** An incrementing integer reference (`requestIdRef.current`) tracks every query dispatch. If a response resolves whose ID does not match the active `requestIdRef`, it is immediately discarded.

---

## 3. Search vs. Category Filter Trade-off Decision (Phase 3)

### The API Limitation:
DummyJSON provides two separate endpoints:
- `GET /products/search?q=...`
- `GET /products/category/:category?`

DummyJSON **cannot** accept both parameters simultaneously (e.g., searching for "phone" within the "smartphones" category).

### The UX Decision:
- **Priority Rule:** Keyword search takes precedence over category filtering.
- **UI Behavior:** When the user types a search query, the Category dropdown is cleanly disabled, and a subtle informative banner informs the user:
  > *"API Limitation: DummyJSON does not support simultaneous keyword search and category filtering. Category filter is paused while search query is active."*
- **Recovery:** Clearing the search input immediately re-enables category filtering and restores the previous category selection without data loss.

---

## 4. Client-Side Session Write Persistence Overlay (Phase 5)

### The API Limitation:
DummyJSON is a public read-only mock API. Calling `POST /products/add`, `PUT /products/:id`, or `DELETE /products/:id` returns simulated HTTP `200` / `201` payloads, but **does not persist changes to DummyJSON's database**. A subsequent `GET /products` returns original static data.

### The Engineering Solution:
We designed a **Client-Side Session Write Overlay Layer** (`ProductSessionContext`):
1. **Mutation Tracking:** Stores newly created products (`addedProducts`), modified fields (`updatedProducts`), and deleted product IDs (`deletedProductIds`).
2. **Overlay Merger (`applySessionOverlay`):** Intercepts all raw `GET /products` responses:
   - Prepends session-added items to the top of the list.
   - Overrides modified fields on existing products.
   - Strips out deleted IDs from listings and detail views.
   - Adjusts total count metrics accordingly.
3. **Session Durability:** Syncs state to browser `sessionStorage` (`nexgensis_product_session_overlay`) so that creations, edits, and deletions persist across page refreshes and navigation during an active evaluation session.
4. **Clean Enterprise Feedback:** Toast notifications provide clear, affirmative user feedback (e.g., *"Product created successfully"*, *"Product updated successfully"*).

---

## 5. TypeScript Philosophy: Clarity Over Cleverness

### Why Flat, Simple Interfaces Were Used:
- **Philosophy:** Types were defined as plain, flat interfaces (`Product`, `Review`, `User`, `ApiError`, `ProductFormValues`, `SortField`, `SortOrder`).
- **Rationale:** 
  1. Avoided deep generic constraints, conditional types, or brittle `Pick<Omit<Partial<...>>>` chains.
  2. Every type directly maps to the real domain entity and API contract, making every single line of TypeScript instantly readable and explainable during a live technical review or live code-modification challenge.

---

## 6. Where AI Tooling Accelerated Development

1. **Enterprise Design System & Token Generation:** Rapidly scaffolding Tailwind CSS color scales (Indigo primary, Slate neutrals, Emerald/Red/Amber semantics) and ensuring consistent spacing, radius (`rounded-lg`), and shadow scales.
2. **Zero-CLS Layout Skeletons:** Creating mirror-image pulse loaders that match table column widths, mobile cards, and detail galleries to eliminate Cumulative Layout Shift.
3. **Defensive Edge-Case Coverage:** Formulating mathematical boundary functions (`clampPage`, `generatePaginationRange`, `calculatePaginationSummary`) and input sanitization helpers.
4. **Interactive Walkthrough Tooling:** Generating one-click demo credential autofills and live image URL previewers for frictionless evaluation.
