# Backloggd Plus — Content Script (`backloggd.content`)

> A WXT content script that injects a React-powered UI directly into the [Backloggd](https://backloggd.com) website, enabling authenticated users to export their full game library, which includes ratings, time tracking, etc. as a downloadable CSV file.

---

## Table of Contents

- [Business Logic Overview](#business-logic-overview)
- [Architecture](#architecture)
  - [Data Flow](#data-flow)
  - [Directory Structure](#directory-structure)
- [WXT Content Script Specifics](#wxt-content-script-specifics)
  - [Entry Point & Lifecycle](#entry-point--lifecycle)
  - [Shadow DOM & Style Isolation](#shadow-dom--style-isolation)
  - [Turbo-Aware Navigation Monitoring](#turbo-aware-navigation-monitoring)
- [Technical Stack](#technical-stack)
- [Development Standards](#development-standards)
  - [Path Aliases](#path-aliases)
  - [The Golden Rule: Import Boundaries](#the-golden-rule-import-boundaries)
  - [Feature Isolation](#feature-isolation)
- [State Management](#state-management)
- [API Layer](#api-layer)

---

## Business Logic Overview

The content script's core purpose is to **enhance the Backloggd website with features that the platform does not natively offer**. Currently, the primary feature is **Game Library Export**:

1. **Authentication Detection** — Reads the `#navbarDropdown` DOM element to determine if a user is logged in and extract their username.
2. **UI Injection** — Injects an "Export" button into the site's navigation dropdown menu, visually matching Backloggd's own styling.
3. **Data Scraping** — Fetches the user's paginated game library pages from Backloggd by making HTTP requests and parsing the returned HTML with `DOMParser`.
4. **Detail Enrichment** — For each game discovered, fetches detailed log data (playthroughs, ratings, time played, statuses) from Backloggd's internal JSON API endpoint (`/log/edit/:gameId`).
5. **CSV Generation & Download** — Transforms the aggregated data into a CSV file via PapaParse and triggers a browser download.

> **⚠️ Important:** The APIs consumed are **internal, undocumented Backloggd endpoints** and are subject to breakage at any time without notice. See [`shared/types/api.ts`](./shared/types/api.ts) for the full response type documentation.

---

## Architecture

### Data Flow

```mermaid
flowchart TD
    A["User clicks Export button"] --> B["useExport hook triggers fetch cascade"]
    B --> C["1. Fetch first profile games page"]
    C --> D["Calculate total pages from game count"]
    D --> E["2. Fetch all remaining profile pages in parallel"]
    E --> F["Parse HTML → Extract game IDs, names, URLs"]
    F --> G["3. Fetch /log/edit/:gameId for each game"]
    G --> H["Parse JSON → Extract playthroughs, ratings, time"]
    H --> I["Combine into GameLogDetailsCSV array"]
    I --> J["PapaParse → CSV string"]
    J --> K["Blob → anchor download"]

    style A fill:#7c3aed,color:#fff
    style K fill:#059669,color:#fff
```

### Directory Structure

```
📦 backloggd.content/
┣ 📜 index.tsx          → WXT entry point: defineContentScript, Shadow Root, React mount
┣ 📜 App.tsx            → Root React component: receives username, renders features
┣ 📜 style.css          → Tailwind + DaisyUI scoped to Shadow DOM (:host)
┃
┣ 📂 features/          → Feature modules (vertically sliced)
┃ ┗ 📂 export/          → Game Library Export feature
┃   ┣ 📂 api/           → React Query options factories + fetch functions
┃   ┣ 📂 components/    → UI components (ExportButton)
┃   ┣ 📂 hooks/         → useExport — orchestrates the multi-step fetch cascade
┃   ┣ 📂 utils/         → CSV generation and download logic
┃   ┗ 📜 types.ts       → Feature-specific types (ExportType, GameLogDetailsCSV)
┃
┣ 📂 lib/               → Third-party library configurations (scoped to content)
┃ ┣ 📜 axios.ts         → Axios instance with backloggd.com base URL + interceptors
┃ ┣ 📜 papaparse.ts     → CSV serialization wrapper
┃ ┗ 📜 react-query.ts   → QueryClient with default stale time
┃
┗ 📂 shared/            → Code shared across ALL features within content
  ┣ 📂 components/      → Reusable UI (Button, Dialog, DropdownButton)
  ┣ 📂 hooks/           → useStorage — WXT storage item React binding
  ┣ 📂 types/           → API response types + Axios module augmentation
  ┗ 📂 utils/           → url.ts (navigation detection), user.ts (auth detection)
```

---

## WXT Content Script Specifics

### Entry Point & Lifecycle

WXT uses **file-based routing**. The directory name `backloggd.content` tells WXT:

| Segment | Meaning |
|---------|---------|
| `backloggd` | The content script is registered to match `*://backloggd.com/*` and `*://*.backloggd.com/*` |
| `.content` | This is a **Content Script** entry point (as opposed to `.background` or a popup) |

The entry file [`index.tsx`](./index.tsx) exports a `defineContentScript()` call — a WXT auto-import that registers the script with the extension runtime. **This is the only file WXT reads to configure the entry point**; all other files are internal module imports.

**Execution World:** This content script runs in the browser's **Isolated World** by default. It shares the DOM with the host page but has a **separate JavaScript execution context**. This means:
- ✅ Access to `document.querySelector`, DOM APIs, and `window.location`
- ✅ Access to Chrome Extension APIs (`chrome.storage`, `chrome.runtime`)
- ❌ No access to page-level JavaScript variables or functions
- ❌ Page scripts cannot access the extension's variables

### Shadow DOM & Style Isolation

The UI is injected via WXT's `createShadowRootUi()` helper, which creates a [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) boundary:

```typescript
// index.tsx
const ui = await createShadowRootUi(ctx, {
  anchor: navbarDropdownDividerAnchor,
  append: 'after',
  css,                              // Tailwind + DaisyUI, inlined as string
  name: INJECTED_ROOT_ELEMENT,      // <backloggd-plus-ui> custom element
  position: 'inline',
  onMount: (container) => {
    const root = createRoot(container);
    root.render(
      <QueryClientProvider client={queryClient}>
        <App username={username} />
      </QueryClientProvider>,
    );
    return root;
  },
  onRemove: (root) => root?.unmount(),
});
```

**Why Shadow DOM?**
- **Style Encapsulation** — Backloggd's CSS cannot leak into the extension UI, and the extension's Tailwind/DaisyUI classes cannot break the host page.
- **DOM Isolation** — The injected component tree lives inside a shadow root (`<backloggd-plus-ui>` custom element), keeping it invisible to Backloggd's own JavaScript and DOM queries.
- **CSS Strategy** — `style.css` is imported as a raw string (`?inline`) and passed into the Shadow Root. DaisyUI is configured with `root: ':host'` to scope its theme variables to the shadow boundary instead of `:root`.

### Turbo-Aware Navigation Monitoring

Backloggd uses [Hotwire Turbo](https://turbo.hotwired.dev/) for client-side navigation, which means the page doesn't fully reload on route changes. The content script handles this with a `requestAnimationFrame` loop that monitors `location.href` for changes:

```typescript
// index.tsx
const monitorChanges = () => {
  if (ctx.isInvalid) { return; }         // Stop if extension context invalidated
  if (hasUrlChanged(url)) {
    url = location.href;
    inject();                             // Re-inject UI on navigation
  }
  ctx.requestAnimationFrame(monitorChanges);
};
```

The `ctx.isInvalid` check ensures the monitoring loop is cleaned up when the extension is disabled, updated, or unloaded — preventing orphaned listeners.

---

## Technical Stack

| Technology | Purpose | Location |
|------------|---------|----------|
| **WXT** | Extension framework — entry point routing, Shadow Root helpers, auto-imports, storage API | `index.tsx` |
| **React 19** | Component rendering inside Shadow DOM | `App.tsx`, `features/`, `shared/components/` |
| **React Query (TanStack)** | Server state management — caching, parallel queries, stale/refetch control | `lib/react-query.ts`, `features/export/api/` |
| **Axios** | HTTP client with response interceptors that unwrap `response.data` | `lib/axios.ts` |
| **PapaParse** | CSV serialization from JS objects | `lib/papaparse.ts` |
| **Tailwind CSS v4** | Utility-first styling (via Vite plugin) | `style.css` |
| **DaisyUI v5** | Component library (buttons, modals, dialogs) scoped to `:host` | `style.css` |
| **react-i18next** | Internationalization — `content` namespace for all content script strings | Components via `useTranslation()` |
| **classnames** | Conditional CSS class merging | `Button.tsx`, `DropdownButton.tsx` |

---

## Development Standards

### Path Aliases

Path aliases are configured in **two places** that must stay in sync:

1. **`tsconfig.json`** (root) — For TypeScript type checking and IDE autocomplete
2. **`wxt.config.ts`** — For Vite's build-time module resolution

| Alias | Resolves To | Architectural Purpose | Example |
|-------|-------------|----------------------|---------|
| `@content/*` | `./entrypoints/backloggd.content/*` | Content script internal imports — avoids deep relative paths within the content script | `import { api } from '@content/lib/axios'` |
| `@popup/*` | `./entrypoints/popup/*` | Popup entry point imports | `import { Settings } from '@popup/components/Settings'` |
| `@background/*` | `./entrypoints/background/*` | Background service worker imports | `import { handler } from '@background/handlers/export'` |
| `@globalShared/*` | `./entrypoints/shared/*` | Cross-entrypoint shared code (i18n, storage definitions) | `import i18n from '@globalShared/i18n'` |

**Usage within the content script:**

```typescript
// ✅ CORRECT — Using alias for cross-module imports within content
import { api } from '@content/lib/axios';
import { ProfileGamesPageScrapeResponse } from '@content/shared/types/api';

// ✅ CORRECT — Using alias for cross-entrypoint shared code
import i18n from '@globalShared/i18n';
import { testExportLabelStorageItem } from '@globalShared/storage';

// ✅ CORRECT — Relative imports for same-feature sibling files
import { queryKeys } from './keys';
import { ExportType } from '../types';

// ❌ WRONG — Deep relative path that should use an alias
import { api } from '../../../lib/axios';
```

> **Note:** The root `tsconfig.json` defines all aliases globally to centralize alias definitions and keep the configuration DRY while each entry point prefix (`@content/`, `@popup/`, `@background/`) naturally prevents naming collisions.

---

### The Golden Rule: Import Boundaries

> **🚫 Never import code from one entry point into another.**

ESLint enforces strict import boundaries via the `import/no-restricted-paths` rule, configured in [`eslint.constants.ts`](../../eslint.constants.ts):

```
 ┌────────────────┐    ┌────────────────┐    ┌────────────────┐
 │   background   │ ✖─ │    content    │ ─✖ │     popup      │
 └───────┬────────┘    └───────┬────────┘    └───────┬────────┘
         │                     │                     │
         │     ┌───────────────┴──────────────┐      │
         └─────►    entrypoints/shared/       ◄──────┘
               │  (i18n, storage — allowed)   │
               └──────────────────────────────┘
```

**The rules:**

| Rule | Scope | What's Blocked | What's Allowed |
|------|-------|----------------|----------------|
| **Entry Point Isolation** | Each entry point (`content`, `popup`, `background`) | Importing from any *other* entry point's directory | Importing from own directory + `entrypoints/shared/` |
| **Feature Isolation** | Each feature inside `content/features/` | Importing from any *other* feature's directory | Importing from own feature directory only |
| **Shared Protection** | `entrypoints/shared/` | Importing from any entry point | Importing from its own `shared/` directory |

**Why this matters — Technical Risks:**

1. **Bundle Bloat** — Each entry point (content, popup, background) is bundled **separately** by WXT/Vite. Importing popup code into the content script would pull the entire popup dependency tree into the content script bundle, dramatically increasing its size and load time on every page.

2. **Runtime Errors in Isolated Worlds** — Content scripts run in the browser's **Isolated World**, which does not have access to extension-specific APIs available only in the popup context (`chrome.action`) or background context (`chrome.webNavigation`, certain `chrome.tabs` overloads). Code that works in one context may throw `TypeError: chrome.action is undefined` at runtime in another.

3. **Lifecycle Mismatch** — A content script is created and destroyed per-tab and per-navigation. The background service worker is a long-lived singleton. The popup is ephemeral — created on click, destroyed on close. Sharing code between these contexts creates subtle state management bugs and memory leaks.

**ESLint zone configuration:**

```typescript
// eslint.constants.ts — Simplified view
const entrypointImportRestrictions = entrypoints.map((entrypoint) => ({
  target: `entrypoints/${entrypoint}`,          // Files IN this entry point...
  from: 'entrypoints',                          // ...cannot import from entrypoints/...
  except: [`./${entrypoint}`, './shared'],       // ...except their own dir and shared.
}));

const featureImportRestrictions = features.map((feature) => ({
  target: `entrypoints/backloggd.content/features/${feature}`,
  from: 'entrypoints/backloggd.content/features',
  except: [`./${feature}`],                      // Each feature can only import itself.
}));
```

---

### Feature Isolation

Features follow a **vertical slice architecture**. Each feature under `features/` is a self-contained module with its own `api/`, `components/`, `hooks/`, `utils/`, and `types.ts`:

```
features/
└── export/          ← One feature = one vertical slice
    ├── api/         ← React Query options + fetch functions
    ├── components/  ← UI components specific to this feature
    ├── hooks/       ← Custom hooks orchestrating feature logic
    ├── utils/       ← Feature-specific utility functions
    └── types.ts     ← Feature-specific type definitions
```

**Sharing between features:** If two features need the same code, it must be lifted to `shared/` (content-level) or `lib/` — never imported across feature boundaries.

---

## State Management

The content script uses a **layered state management** approach:

| Layer | Tool | Purpose | Example |
|-------|------|---------|---------|
| **Server State** | React Query (`useQuery`, `useQueries`) | API responses, caching, stale management, parallel fetching | `useExport` hook — cascading queries |
| **Local UI State** | React `useState` | Component-level toggles (modal open, export triggered) | `ExportButton` — `isModalOpen`, `isExportTriggered` |
| **Persistent State** | WXT `storage` API + `useStorage` hook | Cross-context values persisted in `chrome.storage.local` | `testExportLabelStorageItem` — popup ↔ content sync |

The `useExport` hook demonstrates the **cascading query pattern**: it chains three levels of `useQuery`/`useQueries` calls where each level enables the next only after the previous completes successfully, avoiding race conditions and unnecessary fetches.

---

## API Layer

The API layer uses a **custom Axios instance** with Backloggd-specific configuration:

- **Base URL:** `https://backloggd.com`
- **Response Interceptor:** Unwraps `response.data` automatically — callers receive the response body directly instead of the full `AxiosResponse` wrapper.
- **Error Interceptor:** Normalizes all errors (Axios errors, generic errors, unknown) into a consistent `{ message, status, url }` shape.
- **Type Augmentation:** [`axios.d.ts`](./shared/types/axios.d.ts) overrides Axios's generic method signatures so that `api.get<T>(url)` returns `Promise<T>` directly (matching the unwrapped interceptor behavior).

```typescript
// Usage — the return type is GameLogDetailsResponse, not AxiosResponse<GameLogDetailsResponse>
const details = await api.get<GameLogDetailsResponse>(`/log/edit/${gameId}`);
```
