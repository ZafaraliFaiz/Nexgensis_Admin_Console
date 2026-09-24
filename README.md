# NexGensis Admin Console — Product Admin Dashboard

An enterprise-grade, login-gated Product Admin Dashboard built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Axios**. Built to a high-polish SaaS quality bar (Linear / Stripe aesthetic) with hand-written data fetching, pagination, race-condition guards, and URL-synchronized state management.

---

## 🌟 Live Demo & Deployment
- **Live Demo:** [https://nexgensis-admin-console.vercel.app](https://nexgensis-admin-console.vercel.app) *(or deploy your own using Vercel)*
- **GitHub Repository:** [https://github.com/ZafaraliFaiz/Nexgensis_Admin_Console.git](https://github.com/ZafaraliFaiz/Nexgensis_Admin_Console.git)

---

## 🚀 Key Features & Capabilities

### 1. Authentication & Route Protection
- **DummyJSON Auth API:** Authenticates users via `POST /auth/login` (supports demo credentials like `emilys` / `emilyspass`).
- **Edge Middleware Protection:** Server-side route interception inspecting `auth_token` cookies. Non-authenticated visitors accessing `/products` or `/dashboard` are redirected to `/login`; authenticated users hitting `/login` are automatically forwarded to `/products`.
- **Session Synchronization:** Stores tokens and user profiles across `localStorage` (client lookup) and `cookies` (SSR/Middleware).
- **One-Click Demo Autofill:** Instant autofill bar on `/login` for evaluation walkthroughs.
- **Graceful Logout:** Clears cookies/tokens, triggers toast feedback, and redirects to login.

### 2. Responsive Product Catalog
- **Desktop Data Table (`md+`):** High-density table with product thumbnails, categorized titles, SKU identifiers, currency formatting, rating stars, and dynamic stock badges.
- **Mobile Cards (`<md`):** Stacked cards with complete data parity, eliminating horizontal table squeeze.
- **Hand-Crafted Pagination:** Page size switcher (`10`, `20`, `50`), exact range indicators (*"Showing 21–40 of 194"*), and truncated page number windows (`1 2 3 ... 10`).

### 3. Search, Category Filtering & Sorting
- **Debounced Search (400ms):** Local keystrokes update immediately; network queries dispatch after typing settles.
- **Race-Condition Safe:** Uses an `AbortController` and monotonic request ID reference (`requestIdRef`) to discard stale, out-of-order responses from earlier keystrokes. *(Testable with `&delay=2000`)*.
- **Category Taxonomy:** Dropdown dynamically populated from `GET /products/categories`.
- **Multi-Field Sorting:** Sort by Price (Low/High), Rating (Highest/Lowest), and Title (A-Z/Z-A).
- **API Conflict Resolution:** DummyJSON cannot perform category filtering and keyword search simultaneously. The UI gives search precedence and pauses category filtering with an informative banner.

### 4. URL State Synchronization
All 5 state dimensions coexist cleanly in the URL:
```text
/products?page=2&pageSize=20&q=phone&sortBy=price&order=asc
```
Direct links, browser refreshes, or shared URLs reproduce the exact filtered state.

### 5. Deep Product Inspection
- **Interactive Gallery:** Multi-image gallery with thumbnail switcher strip, image index badge, and fallback placeholders.
- **Pricing & Discounts:** Calculates and displays original price strikethroughs alongside promotional savings tags.
- **Technical Logistics Grid:** Formatted weight, physical dimensions (`W × H × D cm`), warranty terms, shipping window, return policy, and barcode data.
- **Verified Customer Reviews:** Star rating breakdown with average score and resilient handling for missing/empty review arrays.
- **404 Not Found Page:** Dedicated Not-Found screen (`app/products/[id]/not-found.tsx`) with recovery navigation.

### 6. Create, Update & Delete Mutations
- **Shared Validated Form (`ProductForm`):** Strict field validation (title length, price > 0, stock >= 0, description length, valid image URL) with live thumbnail preview.
- **Rapid Double-Click Guards:** Submitting ref lock (`isSubmittingRef.current`) prevents concurrent duplicate submissions.
- **Custom Delete Dialog (`DeleteConfirmModal`):** Styled modal with backdrop dismissal, warning notice, and loading spinner.
- **Client-Side Session Write Persistence Overlay (`ProductSessionContext`):** Because DummyJSON is a read-only mock API that does not persist writes, mutations are overlaid in an in-memory & `sessionStorage` cache so created, edited, and deleted items persist throughout the active session.

### 7. Global UX & Polish
- **Zero-CLS Skeletons:** Dedicated loading skeletons matching table, card, and detail geometries.
- **100% Toast Notification Coverage:** `react-hot-toast` notifications on login, logout, create, edit, delete, and fetch retries.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 14+ (App Router) | Server-Side Rendering, Route Groups, Edge Middleware |
| **Language** | TypeScript | Flat, plain interfaces (`Product`, `Review`, `User`, `ApiError`, `ProductFormValues`) |
| **Styling** | Tailwind CSS | Enterprise SaaS theme (Indigo primary, Slate neutrals, Emerald/Red semantics) |
| **Networking** | Axios | Single shared client (`axiosClient.ts`) with request/response interceptors |
| **Icons** | Lucide React | Clean, modern iconography |
| **Feedback** | React Hot Toast | Semantic toast notifications |

---

## 📂 Project Architecture

```text
nexgensis-admin-console/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard route group shell & ProductSessionProvider
│   │   ├── dashboard/page.tsx        # High-level metrics overview
│   │   └── products/
│   │       ├── page.tsx              # Paginated catalog table/cards with filters
│   │       ├── new/page.tsx          # Create product view
│   │       └── [id]/
│   │           ├── page.tsx          # Product detail inspection view
│   │           ├── edit/page.tsx     # Edit product view
│   │           └── not-found.tsx     # 404 Product Not Found screen
│   ├── login/page.tsx                # Enterprise auth view with demo autofill
│   ├── globals.css                   # Tailwind tokens & scrollbar styling
│   ├── layout.tsx                    # Root layout with Inter font & ToasterProvider
│   └── page.tsx                      # Root redirector (/ -> /products or /login)
├── components/
│   ├── common/
│   │   ├── DeleteConfirmModal.tsx    # Styled deletion confirmation dialog
│   │   ├── EmptyState.tsx            # Zero-results presentation
│   │   ├── ErrorState.tsx            # API error card with retry button
│   │   └── ToasterProvider.tsx       # Themed react-hot-toast provider
│   ├── layout/
│   │   ├── DashboardLayout.tsx       # Master shell wrapper
│   │   ├── Navbar.tsx                # Sticky top navigation with user menu
│   │   └── Sidebar.tsx               # Collapsible desktop & mobile drawer navigation
│   └── products/
│       ├── PaginationControl.tsx     # Hand-crafted pagination buttons & size selector
│       ├── ProductCardList.tsx       # Mobile stacked cards
│       ├── ProductDetailSkeleton.tsx # Layout-matching detail skeleton
│       ├── ProductFilters.tsx        # Search, category, sort toolbar
│       ├── ProductForm.tsx           # Validated shared Add/Edit form
│       ├── ProductGallery.tsx        # Interactive thumbnail gallery
│       ├── ProductReviews.tsx        # Customer reviews breakdown
│       ├── ProductSkeleton.tsx       # Table & card loading skeletons
│       └── ProductTable.tsx          # Desktop data table
├── lib/
│   ├── api/
│   │   ├── axiosClient.ts            # Shared Axios instance with interceptors
│   │   ├── auth.ts                   # Auth API endpoints (login, getCurrentUser)
│   │   └── products.ts               # Product API endpoints (get, search, add, put, delete)
│   ├── context/
│   │   └── ProductSessionContext.tsx # Client-side write persistence overlay
│   └── utils/
│       ├── authStorage.ts            # Cookie & localStorage token manager
│       └── pagination.ts             # Math helpers, bounds clamping, param sanitizers
├── middleware.ts                     # Next.js Edge Middleware for route protection
├── types/
│   └── index.ts                      # Flat, plain TypeScript contracts
└── tailwind.config.ts                # Design tokens & color system
```

---

## 💻 Local Setup & Running

### Prerequisites
- Node.js 18.17+ or 20+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/ZafaraliFaiz/Nexgensis_Admin_Console.git
cd Nexgensis_Admin_Console
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
npm run start
```

---

## 🔑 Demo Credentials (DummyJSON)
You can use the built-in 1-click autofill buttons on the login page, or manually enter:

| Username | Password | Role |
| :--- | :--- | :--- |
| `emilys` | `emilyspass` | Administrator |
| `michaelw` | `michaelwpass` | Administrator |

---

## ⚠️ Known Limitations & API Architecture Notes
1. **Mock Write Persistence:** DummyJSON is a public read-only demonstration API. `POST /products/add`, `PUT /products/:id`, and `DELETE /products/:id` return simulated responses but do not modify the remote database. This application solves this with a **Client-Side Session Write Persistence Overlay** (`ProductSessionContext`), ensuring creations, edits, and deletions persist across views and page refreshes for your active session.
2. **Search vs. Category Filtering:** DummyJSON does not support simultaneous search (`/products/search?q=`) and category filtering (`/products/category/:category`). The application prioritizes keyword search and cleanly disables the category filter with an explanatory UI notice while a search term is active.
