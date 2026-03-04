# Error Handling & Reporting (Invest App)

This document describes **how errors flow through the app**, how to use the
unified error handler, and where UI helpers live after the latest refactors.

## 1. High‑level design

- **Single entry point:** All non-trivial errors should go through
  `reportError` from `InvestCommon/domain/error/errorReporting`.
- **Unified bootstrap:** Use `setupErrorHandling` from
  `InvestCommon/domain/error/unifiedErrorHandler` once at app entry
  (Vue app or VitePress).
- **UI vs data boundaries:**
  - Data layer (`invest-common/src/data/**`) **never** shows toasts or navigates.
    It sets `state.error` and rethrows.
  - Domain and feature layers decide whether to call `oryErrorHandling`,
    `oryResponseHandling`, or `reportError`.
- **Analytics aware:** When `VITE_ENABLE_ANALYTICS=1`, the error reporter sends
  normalized errors to the analytics service; otherwise it is a no‑op logger.

## 2. Key building blocks

- `InvestCommon/domain/error/unifiedErrorHandler.ts`
  - `setupErrorHandling({ app, type })` — wire global handlers for:
    - Vue app errors (`app.config.errorHandler`)
    - Global `error` + `unhandledrejection`
    - Optional VitePress integration
- `InvestCommon/domain/error/errorReporting.ts`
  - `reportError(error, comment?)` — main entry; use in `catch` blocks.
  - `setErrorLogger(fn)` / `setErrorReporter(fn)` — allow tests and analytics
    to hook into the pipeline.
  - `toasterErrorHandling(normalizedError)` — converts an error into a toast;
    used internally by `reportError`, rarely directly.
- `InvestCommon/domain/error/oryErrorHandling.ts`
  - Handles Ory Kratos flows (login, registration, settings, recovery).
  - Uses toasts, dialogs, and redirects instead of raw `reportError` because
    Ory often returns UI messages in responses.
- `InvestCommon/domain/error/oryResponseHandling.ts`
  - Handles *successful* Ory responses that still contain human‑readable UI
    messages; used for friendly banners instead of error toasts.

## 3. Where UI helpers live now

- **Toasts / generic HTTP errors**
  - Use `UiKit/helpers/generalErrorHandling` for low‑level `Response` handling
    in UiKit / shared utilities.
  - For app flows, prefer `reportError` which will **log + toast** via the
    unified pipeline.

- **Highlight directive**
  - Vue directive is defined in `UiKit/helpers/v-highlight`.
  - Registered in:
    - `.vitepress/theme/index.ts` for docs.
    - App entry for the main SPA (via `app.directive('highlight', highlight)`).

- **Shared formatting helpers**
  - Currency and number helpers now live in `UiKit/helpers/currency` and
    `UiKit/helpers/numberFormatter`.
  - Date helpers for UI live in `UiKit/helpers/formatters/formatToDate`.
  - Investment/distribution‑specific mappings are in:
    - `InvestCommon/data/investment/investment.formatter.ts`
    - `InvestCommon/data/distributions/distributions.formatter.ts`

## 4. How to use in features

### 4.1 Typical catch block

```ts
import { reportError } from 'InvestCommon/domain/error/errorReporting';

try {
  await repository.someAction();
} catch (error) {
  reportError(error, 'Optional human‑readable context');
}
```

### 4.2 Ory authentication / settings flows

```ts
import { oryErrorHandling } from 'InvestCommon/domain/error/oryErrorHandling';

try {
  await authRepository.login(credentials);
} catch (error) {
  await oryErrorHandling(error, 'login', resetFlow, 'Login failed');
}
```

## 5. Testing notes

- Unit tests for Ory and unified handler live under
  `invest-common/src/domain/error/__tests__`.
- For tests that should not hit analytics:
  - Use `setErrorReporter(vi.fn())` or mock `reportError` directly.
- UiKit‑level toast behavior is covered by
  `ui-kit/src/helpers/__tests__/generalErrorHandling.test.ts`.

# Error handling

**Related:** Data layer and repos — **docs/DATA_LAYER.md**. Usage guide and quick start — **invest-common/src/domain/error/README.md**.

## Summary

- **One bootstrap:** `setupErrorHandling({ app, type: 'vue' })` in `main.ts` (or `type: 'vitepress'` for VitePress). Wires 401 redirect, central logger, and global + framework handlers.
- **One reporting path:** Caught and uncaught errors go through `reportError` → normalize → log (analytics) → 401/429 branching → toast. No `console.error` override.
- **Entry points:** `reportError` in catch blocks; `oryErrorHandling` for Ory auth/settings; `oryResponseHandling` after successful auth flow.

## Overview

- **Repositories** set `state.error` and rethrow. Callers handle UI.
- **Callers** catch and call:
  - **oryErrorHandling** — Auth/settings (Ory flows). Uses **reportError** for generic toasts.
  - **reportError** (or **toasterErrorHandling**) — Everything else.
- **Default reporter** (when no custom reporter is set): normalize → log (or `console.error`) → branch 401/429 → show toast. **401** is wired at bootstrap via **setupErrorHandling** (Vue: default redirect to sign-in).

## Entry points

All error-handling entry points live under **InvestCommon/domain/error/**:

| Import | Use when |
|--------|----------|
| `InvestCommon/domain/error/unifiedErrorHandler` | **setupErrorHandling** — single bootstrap at app/VitePress entry |
| `InvestCommon/domain/error/errorReporting` | reportError, setErrorLogger, setErrorHandlers, normalizeError, toasterErrorHandling |
| `InvestCommon/domain/error/oryErrorHandling` | Ory auth/settings catch blocks |
| `InvestCommon/domain/error/oryResponseHandling` | After successful auth flow fetch |

See also **invest-common/src/domain/error/README.md** for quick start and best-practices checklist.

### File layout (domain/error)

| File | Role |
|------|------|
| **unifiedErrorHandler.ts** | Global handlers (unhandledrejection, window.error), Vue/VitePress hooks, ignorable filter, `setupErrorHandling`. |
| **errorReporting.ts** | `reportError`, `normalizeError`, `setErrorLogger`, `setErrorHandlers`, `toasterErrorHandling`, default reporter (log → 401/429 → toast). |
| **oryErrorHandling.ts** | Ory Kratos error handling (toast, navigate, dialogs); uses `reportError` for generic cases. |
| **oryResponseHandling.ts** | Ory success-path UI (duplicate account, info messages); uses toast only. |

Analytics: **invest-common/src/domain/analytics/sendReportedErrorToAnalytics.ts** (used as `setErrorLogger` at bootstrap).

## Usage

- **oryErrorHandling(error, flowType, resetFlow, comment, onSessionRefresh?)** — Auth/settings only. Second argument `flowType`: `'login' | 'registration' | 'settings' | 'recovery' | 'verification' | 'logout' | 'signup' | 'browser'`. Uses **reportError** for generic errors.
- **toasterErrorHandling(error, fallbackMessage)** — Raw toast; prefer **reportError** so the default reporter does log-then-show and branching.
- **reportError(error, fallbackMessage)** — Default: normalize → log → branch 401/429 → toast. **Never throws** (wrapped in try/catch). Use in catch blocks so tests can mock one interface.
- **setErrorReporter(fn?)** — Replace the reporter (e.g. tests: `setErrorReporter(vi.fn())`). No args or `null` to reset.
- **setErrorLogger(fn?)** — Called for every reported error with `(normalized, fallbackMessage)` before the toast. Use for analytics. Reset with `setErrorLogger(null)`.
- **setErrorHandlers(handlers)** — Optional: `onUnauthorized` (401), `onRateLimited` (429). Extend `ErrorHandlers` to add more codes.
- **normalizeError(error, fallbackMessage)** — Returns `{ message, code?, statusCode? }` for branching or analytics.

## Default reporter flow (log then show)

1. `normalizeError(error, fallbackMessage)` → `{ message, code?, statusCode? }`
2. If **setErrorLogger** set: call it; else `console.error('[reportError]', fallbackMessage, normalized)`
3. If 401 and `onUnauthorized` set: call it and return (no toast)
4. If 429: call `onRateLimited` if set, then show "Too many requests" toast
5. Else: show toast via `toasterErrorHandling(error, fallbackMessage)`

Wire analytics at bootstrap: **setupErrorHandling** already calls **setErrorLogger(sendReportedErrorToAnalytics)**.

## Error codes

- **401** — Wired by setupErrorHandling for Vue (default: **redirectToSigninForUnauthorized** from `InvestCommon/domain/redirects/redirectAuthGuard` — resetAllData + navigate to sign-in with redirect param); reporter calls `onUnauthorized` and skips toast.
- **429** — Reporter shows "Too many requests…" and calls `onRateLimited(normalized)` if set.
- **More** — Extend `ErrorHandlers` and add a branch in the default reporter.

## Bootstrap (single entry point)

Call **setupErrorHandling** once at app entry. Use it for both the Vue app and VitePress.

- **Vue** (e.g. `src/main.ts`): `setupErrorHandling({ app, type: 'vue' })`  
  - Sets 401 handler (default: redirect to sign-in), sets central logger, registers global + Vue error handlers.
- **VitePress**: `setupErrorHandling({ type: 'vitepress' })`  
  - Sets central logger, registers global + VitePress error handlers (no 401 redirect unless you pass `onUnauthorized`).

Skips when `VITE_ENV=local`. Do not call `setErrorHandlers`, `setErrorLogger`, or `setupVueErrorHandler` / `setupVitePressErrorHandler` directly in app code; use **setupErrorHandling** instead. Analytics runs when **VITE_ENABLE_ANALYTICS=1** (see sendReportedErrorToAnalytics).

## What we log and how

| Source | Path | Logging |
|--------|------|--------|
| Caught errors | Call sites use `reportError(error, fallbackMessage)` | Default reporter → **setErrorLogger** (analytics) → toast; 401/429 branching |
| Uncaught errors | unhandledrejection, window.error, Vue/VitePress errorHandler | If not ignorable → **reportError** → same path (toast + analytics); fatal → redirect to 500 |

**What we do not log (ignorable):** ResizeObserver loop/limit, AbortError/canceled, chunk load failures. No toast, no analytics, so monitoring stays focused on real issues.

**How we log:** One central logger, **sendReportedErrorToAnalytics**, wired by setupErrorHandling. It runs when `VITE_ENABLE_ANALYTICS=1`, skips when `navigator` is undefined (SSR), and skips known bots. No override of `console.error` (best practice).

### Central logging

**setupErrorHandling** wires **setErrorLogger(sendReportedErrorToAnalytics)** so every reported error is sent to the analytics log when **VITE_ENABLE_ANALYTICS=1** (env: `VITE_ENABLE_ANALYTICS`). Same path for Vue and VitePress. Implementation: **invest-common/src/domain/analytics/sendReportedErrorToAnalytics.ts**.

## Global error handler

**setupErrorHandling** (see Bootstrap above) registers a single path for uncaught errors:

- **window.unhandledrejection** — unhandled promise rejections
- **window.error** — synchronous runtime errors
- **app.config.errorHandler** (Vue) or **VitePress** hooks — render/router/page errors

Each calls **reportError(error, 'Something went wrong')** so the user sees a toast and the central logger sends to analytics—**unless** the error is ignorable (ResizeObserver, AbortError, chunk load). Fatal errors (`error.isFatal === true`) also redirect to the 500 page.

## Practices

- **Separation of concerns** — Repos don’t handle UI; callers decide how to present errors.
- **Single responsibility** — One place normalizes to user message; one entry point for reporting.
- **Consistency** — Non-Ory call sites use **reportError**; auth/settings use **oryErrorHandling**. No bare `console.error` or empty catch in app code.
- **New call sites** — Add `.catch(reportError)` or try/catch + reportError for any repo call that isn’t awaited. For form flows that set an inline error (e.g. `filesUploadError`), also call **reportError** so the failure is logged and toasted. Existing coverage: settings, earn, profile, notifications, offers, invest, wallet, accreditation, distributions, filer (useUploaderWithIds), fire-and-forget flows.
- **Intentional console** — Default reporter fallback log; session refresh; analytics/chunk handlers; WebSocket parse; ui-kit. For ui-kit, consider a reporter prop if app toasts are needed.

## Optional

- **More status codes** — Add e.g. `onForbidden` (403) to `ErrorHandlers` and a branch in the default reporter in **errorReporting.ts**.
