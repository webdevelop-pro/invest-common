# Domain layer

Single reference for the `invest-common/src/domain` layer: structure, conventions, and how to use it together with the data and feature layers.

## 1. Overview

The domain layer is the **application core** for the dashboard. It sits **between UI (features, router, UiKit)** and **data (repositories)** and is responsible for:

- **Session & auth flow** — `domain/session`, `domain/redirects`.
- **Current profile & profile‑dependent state** — `domain/profiles`.
- **Global error handling & analytics** — `domain/error`, `domain/analytics`.
- **Global dialogs & WebSockets** — `domain/dialogs`, `domain/websockets`.
- **App‑level config & reset operations** — `domain/config`, `domain/resetAllData`, `domain/chunkErrorHandler`.

High‑level dependency rule:

- **Features / router** → depend on **domain** + **data**.
- **Domain** → may depend on **data** and `config/env`, but **not** on features.
- **Data** → depends only on `config/env` and shared utilities (no domain, no UI).

## 2. Structure

```text
domain/
├── analytics/         # Error → analytics bridge, stack analysis helpers
├── config/            # App-level config (links, routes, cookies, enums)
├── dialogs/           # Global dialogs store + host component
├── error/             # reportError pipeline and unified error handler
├── profiles/          # Current profile selection and KYC flags
├── redirects/         # Route guards and cross-app redirects
├── session/           # Auth/session store (Kratos session)
├── websockets/        # Notifications WebSocket orchestration
├── chunkErrorHandler.ts  # Chunk load / SW mismatch mitigation
└── resetAllData.ts       # Centralized reset on logout / invalid session
```

Each subfolder exposes **domain‑level entry points** (stores, guards, helpers) that are safe to use from features without knowing about HTTP, env variables, or cross‑cutting concerns.

## 3. Session and reset

### 3.1 `domain/session/store/useSession.ts`

**Role:** Single source of truth for authentication/session.

- **State:**
  - `userSession`: raw Kratos session, initialized from the `session` cookie.
  - `userLoggedIn`: `Boolean(userSession?.active)`.
  - `userSessionTraits`: shorthand for `userSession.identity.traits`.
- **Methods:**
  - `updateSession(session: ISession)`:
    - Updates `userSession`.
    - Sets `session` cookie using `cookiesOptions(new Date(session.expires_at))`.
  - `resetAll()`:
    - Clears `userSession`.
    - Removes `session` cookie via `cookiesOptions()`.

Use `useSessionStore` anywhere you need auth state; do **not** mutate session from repositories.

### 3.2 `domain/resetAllData.ts`

**Role:** Centralized reset logic for logout / invalid sessions.

- `resetAllProfileData()`:
  - Resets profile‑dependent repositories:
    - profiles (profile data only), accreditation, KYC, wallet, filer, investment,
      settings, evm, distributions, esign.
  - **Does not** reset `earn` to preserve positions during navigation.
- `resetAllData()`:
  - Clears all cookies via `useCookies().remove(key, cookiesOptions(new Date(0)))`.
  - Calls `useSessionStore().resetAll()`.
  - Calls `resetAllProfileData()`.
  - Resets auth, offers, notifications and **earn** (full logout).

Use `resetAllData` whenever a session is invalid (401/expired) or on explicit logout. It ensures all domain and data state is consistent.

## 4. Profiles

### 4.1 `domain/profiles/store/useProfiles.ts`

**Role:** Owns “current profile” for the dashboard, including cookies, URL coupling, and KYC‑related flags.

- **State and selectors:**
  - `userProfiles`: profiles list derived from `data/profiles` repository.
  - `selectedUserProfileId`: ID from `selectedUserProfileId` cookie or first profile.
  - `selectedUserProfileData`: merge of list entry + `getProfileByIdState.data`.
  - `selectedUserProfileType`, `selectedUserIndividualProfile`.
  - KYC/compliance computed flags:
    - `selectedUserProfileRiskAcknowledged`
    - `selectedUserProfileAccreditationDataOK`
    - `selectedUserProfileKYCStatusNotStarted`
    - `selectedUserProfileShowKycInitForm`
  - `isCurrentProfileKycApproved`, `getKycApprovedProfiles`, `hasAnyKycApprovedProfile`.
- **Selection & persistence:**
  - `setSelectedUserProfileById(id)`:
    - If the profile ID changes, calls `resetAllProfileData()` to clear profile‑dependent repos.
    - Updates `selectedUserProfileId`.
    - Saves to cookie with expiry from `userSession.expires_at` or a 1‑year fallback.
- **Initialization & fetching:**
  - `init()`:
    - Loads user profiles (`getUser`) when `userLoggedIn` and profiles are not yet loaded.
  - Watchers coordinate:
    - On `userLoggedIn` → call `init`.
    - On `getUserState.error` → trigger logout (expired/invalid session).
    - On first profile ID → auto‑select first profile when none is selected.
    - On `[selectedUserProfileId, selectedUserProfileType, isUrlProfileSameAsSelected]` →
      clear and fetch profile data/options when selection and URL match.

**Best practice:**  
Use `useProfilesStore` for anything related to “current profile” instead of reading repositories directly.

### 4.2 `domain/redirects/redirectProfileIdGuard.ts`

**Role:** Keeps router URL and `useProfilesStore` selection in sync.

- If `meta.checkProfileIdInUrl` is set:
  - Ensures profiles are loaded (`getUser`).
  - If no profiles → no‑op.
  - If URL has no `profileId` → redirect to same route with first profile id.
  - If URL `profileId` doesn’t exist → redirect to first existing profile (fallback to `selectedUserProfileId`).
  - If valid → calls `setSelectedUserProfileById(urlProfileId)`.

## 5. Redirects & route guards

### 5.1 Auth guards

**`redirectAuthGuard`** (Vue router guard, dashboard app):

- For each navigation:
  - If not logged in:
    - Calls `useRepositoryAuth().getSession()`.
    - If session active:
      - `updateSession(session)`, `profilesStore.init()`, allow.
    - If `null` (401):
      - `resetAllData()` to clear any stale cookies/state.
      - If route `meta.requiresAuth`, redirect to signin.
  - If logged in:
    - Calls `getSession()` again to validate cookies vs server.
    - If session is not active:
      - `resetAllData()` and redirect to signin for protected routes.
    - If session ID changed:
      - `updateSession(session)` and `profilesStore.init()`.
  - If `userLoggedIn` is true but `userSession` is missing:
    - `resetAllData()`.
- On error:
  - `reportError(error, 'Auth guard')` and `resetAllData()`.

**`redirectAuthGuardStatic`** (static site/VitePress):

- Skips in SSR and on authenticator path.
- Calls `getSession()`:
  - If response exists → `updateSession`.
  - Else → `resetAll`.

**`redirectToSigninForUnauthorized(redirectPath?)`**:

- Shared 401 handler:
  - Calls `resetAllData()`.
  - Navigates to `urlSignin` with `redirect` query (defaults to current URL).

### 5.2 Investment route guard

**`createInvestmentRouteGuard(seoTitle, seoDescription)`**:

- Per‑route guard used for investment detail pages:
  - Sets SEO meta (title, description, canonical) via `usePageSeo`.
  - Ensures investments for the current profile are loaded; if list is empty, calls `getInvestments(profileId)`.
  - Checks whether the `id` param exists in `getInvestmentsState.data.data` (`IInvestmentFormatted`).
    - If not → redirect to `/error/404`.
  - If the detail investment is not loaded, calls `getInvestOne(id)`.
  - On error → `reportError(error, 'Failed to load investment')` and return `/error/404`.

### 5.3 Dashboard ↔ static redirects

- **`redirectDashboardToStaticPages`**:
  - When dashboard routes hit paths like `/faq`, `/how-it-works`, `/resource-center`, `/offers`, etc. (or `/`), redirects to the static site (`env.FRONTEND_URL_STATIC + to.path`) using `navigateWithQueryParams`.
- **`redirectAfterLogout`**:
  - Determines where to send the user after logout:
    - If pathname contains `offer` → redirect back to that offer path.
    - If pathname contains `/invest` → redirect to `urlOffers`.
    - Else → just go to `urlSignin`.

## 6. Error, analytics, dialogs, websockets

These are documented in more detail in **docs/ERROR_HANDLING.md**; this section shows how they fit into the domain layer.

### 6.1 Error & analytics

- **`domain/error/*`** provides:
  - `reportError(error, fallbackMessage)` as the single reporting entry point.
  - `setErrorLogger`, `setErrorHandlers`, `setErrorReporter`, `normalizeError`.
  - `unifiedErrorHandler` with `setupErrorHandling({ app, type })` bootstrap.
- **`domain/analytics/*`**:
  - `useSendAnalyticsEvent` — app‑level analytics sender, enriched with session and env context.
  - `sendReportedErrorToAnalytics` — pluggable error logger wired via `setErrorLogger`; respects `ENABLE_ANALYTICS` and skips bots.
  - `useAnalyticsError` — helper utilities (stack analysis, `buildHttpRequest`, `getClientContext`) with dev‑only logging.

### 6.2 Dialogs

- **`domain/dialogs/store/useDialogs.ts`**:
  - Global state for:
    - Logout dialog, refresh‑session dialog, contact‑us dialog.
  - Provides `showRefreshSession(): Promise<boolean>` and `completeSessionRefresh(success)` to coordinate with auth flows.
  - Exposes `openContactUsDialog(subject?)` / `closeContactUsDialog()`.
- **`domain/dialogs/components/VDialogs.vue`**:
  - Host component that mounts:
    - `VDialogLogOut`, `VDialogRefreshSession`, `VDialogContactUs` using `defineAsyncComponent`.
  - Binds dialog visibility and data to `useDialogs` store.

### 6.3 WebSockets

- **`domain/websockets/store/useWebsockets.ts`**:
  - `useDomainWebSocketStore` with a single method: `webSocketHandler()`.
  - Connects to `NOTIFICATION_URL/ws` using `useWebSocket` with:
    - `autoReconnect` (3 retries, 1s delay) and toast on final failure.
    - Heartbeat (ping every 60s, pong timeout 1s).
  - Listens for messages:
    - Ignores empty and `"pong"` messages.
    - Sends raw payloads to `useRepositoryNotifications.updateNotificationsData`.
    - For parsed `INotification` with `type === 'internal'`, routes by `notification.data.obj`:
      - `profile`, `wallet`, `investment`, `offer`, `filer`, `evm_transfer`, `evm_contract`, etc.
  - Closes the socket when `userLoggedIn` becomes false.
  - Logs connection and status changes only in development via a `debugLog` helper.

## 7. Chunk error handler

### 7.1 `domain/chunkErrorHandler.ts`

**Role:** Handles Vite chunk load errors and Service Worker mismatches by reloading **once** per 30 seconds.

- On `setupChunkErrorHandler()`:
  - Runs only in the browser; idempotent via `window.__chunkErrorHandlerInstalled`.
  - Wraps `console.error` and inspects the first argument string.
  - If the message indicates a dynamic import failure or a Service Worker error on `/assets/*.js` or `/assets/*.css`:
    - Checks `sessionStorage['chunk-error-last-reload']` and reloads only if more than 30s have passed.
    - Writes the current timestamp to `sessionStorage`.
  - On storage failures, logs a warning and reloads once.

Typical usage: call `setupChunkErrorHandler()` once at app bootstrap.

## 8. Principles

- **Domain ≠ data** — Domain orchestrates repositories and handles “when to load”, routing, and cross‑cutting behavior. Data repositories handle HTTP and server state only.
- **Single sources of truth**:
  - `useSessionStore` for auth.
  - `useProfilesStore` for current profile.
  - `resetAllData` for clearing all state.
- **Single error path** — Caught and uncaught errors go through `reportError`, which can be augmented with analytics via `setErrorLogger`.
- **Route guards live in domain** — Auth, profile, investment existence, and dashboard→static redirects are all centralized under `domain/redirects`.
- **Global effects are centralized** — WebSockets, chunk error handling, and dialogs are initialized from the domain layer instead of ad‑hoc in views.

## 9. Adding new domain logic

When you add a new cross‑cutting concern or application service:

1. **Create a folder** under `domain/` (e.g. `domain/payments/`, `domain/featureFlags/`).
2. **Keep responsibilities clear:**
   - Use repositories for API calls and server state.
   - Use domain code for orchestration, routing decisions, and shared app logic.
3. **Expose a small surface area:**
   - Prefer a Pinia store or composable with a few well‑named methods.
   - Avoid leaking low‑level details (URLs, raw responses) to features.
4. **Wire into existing flows carefully:**
   - If it affects auth or profiles, go through `redirectAuthGuard`, `redirectProfileIdGuard`, `useSessionStore`, or `useProfilesStore` rather than duplicating logic.
5. **Add tests** alongside the new domain module in `domain/**/__tests__` for:
   - Happy path behavior.
   - Error handling and interaction with other domain services (e.g. reset, redirects).

Following these patterns keeps the domain layer small, predictable, and consistent with the rest of the codebase.

