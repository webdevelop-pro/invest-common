# Unified Error Handler Usage Guide

**Recommended:** Use **setupErrorHandling** once at app entry for both Vue and VitePress. Full doc: **docs/ERROR_HANDLING.md** (bootstrap, what we log, ignorable errors, practices).

This unified error handler works for both Vue apps and VitePress, providing a single solution for global error handling and analytics integration. Analytics runs when **VITE_ENABLE_ANALYTICS=1** and skips bots and SSR.

## Best practices checklist (by the book)

Aligned with Vue docs, Sentry/LogRocket-style monitoring, and production apps:

| Practice | How we do it |
|----------|----------------|
| **Single reporting path** | All errors go through `reportError` → normalize → log → branch (401/429) → toast. No duplicate paths. |
| **Log then show** | Logger (e.g. analytics) is called before UI; failures in toast don’t lose the event. |
| **Don’t override console** | We never replace `console.error`; devtools and tooling keep working. |
| **Filter noise** | ResizeObserver, AbortError, chunk load errors are ignorable (no toast, no analytics). |
| **Never throw from reporter** | `reportError` and `toasterErrorHandling` are wrapped in try/catch; pipeline never throws. |
| **Normalize before use** | One `normalizeError` shape (`message`, `code`, `statusCode`) for branching and analytics. |
| **Status-code branching** | 401 → `onUnauthorized` (e.g. redirect); 429 → rate-limit handling; extensible via `ErrorHandlers`. |
| **Single bootstrap** | One call: `setupErrorHandling({ app, type: 'vue' })`; no scattered `setErrorHandlers`/`setErrorLogger` in app code. |
| **Testability** | `setErrorReporter(vi.fn())` and optional `setErrorLogger` for tests. |
| **SSR-safe** | Guards for `window`/`navigator`; analytics skips when `navigator` is undefined. |
| **XSS-safe** | User/API data in HTML (e.g. oryResponseHandling) is escaped (`&<>"'`) before `innerHTML`. |

## Design (summary)

- **Single path:** All errors (caught and uncaught) go through `reportError` → default reporter → log (or setErrorLogger) → 401/429 branching → toast. No second path.
- **Log then show:** Logger runs before toast so analytics always see the error even if toast fails.
- **No console.error override:** Global handlers do not replace `console.error`; devtools and tooling keep working.
- **One bootstrap:** `setupErrorHandling` wires 401 handler, central logger, and global/framework handlers in one call. Call once at app entry.
- **Testability:** Use `setErrorReporter(vi.fn())` in tests to mock the reporting pipeline.

## Quick Start

### For Vue Apps

```typescript
// main.ts
import { createApp } from 'vue';
import { setupErrorHandling } from 'InvestCommon/domain/error/unifiedErrorHandler';
import App from './App.vue';

const app = createApp(App);

setupErrorHandling({ app, type: 'vue' });

app.mount('#app');
```

### For VitePress

```typescript
// .vitepress/theme/index.ts
import { setupErrorHandling } from 'InvestCommon/domain/error/unifiedErrorHandler';
import DefaultTheme from 'vitepress/theme';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    setupErrorHandling({ type: 'vitepress' });
  }
};
```

## ⚙️ Advanced

Use **setupUnifiedErrorHandler** only if you need to wire handlers yourself (e.g. custom 401 or no analytics). Otherwise use **setupErrorHandling** with `onUnauthorized` when needed.

## What Gets Captured

- **Global Errors**: Unhandled JavaScript errors (except ignorable ones)
- **Promise Rejections**: Unhandled async failures (except ignorable ones)
- **Vue Errors**: Component errors (app.config.errorHandler)
- **VitePress Errors**: Page, router, and transition errors

All go through **reportError** → toast + setErrorLogger (analytics when enabled). No console.error override.

**Ignorable (not logged, not toasted):** ResizeObserver loop/limit, AbortError/canceled, chunk load failures (handled by chunkErrorHandler). This keeps analytics and UX focused on real issues.

## Naming (domain/error)

| Name | Meaning |
|------|--------|
| **unifiedErrorHandler** | Single handler for global + Vue + VitePress; “unified” = one bootstrap. |
| **errorReporting** (file) | Reporting layer: reportError, normalizeError, setErrorLogger, setErrorHandlers; export **toasterErrorHandling** for raw toast (prefer reportError). |
| **oryErrorHandling** | Handle Ory Kratos *errors* in catch blocks (auth/settings flows). |
| **oryResponseHandling** | Handle Ory *success* responses that contain UI messages (e.g. duplicate identifier, info). |
| **reportError** | Main entry: normalize → log → 401/429 branch → toast. Use in catch blocks. |
| **NormalizedError** | Shape `{ message, code?, statusCode? }` for branching and analytics. |
| **ErrorHandlers** | Optional callbacks for 401 (e.g. redirect) and 429 (e.g. retry). |

## Testing

- **Unit tests:** `invest-common/src/domain/error/__tests__/oryErrorHandling.test.ts`. Mock `reportError` or `setErrorReporter(vi.fn())` in other tests.
- **Global alert (5xx banner):** See **docs/ERROR_HANDLING.md** and UiKit `generalErrorHandling` tests.
