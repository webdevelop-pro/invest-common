# Data layer

Single reference for the `invest-common/src/data` layer: structure, conventions, and how to work with it.

## 1. Overview

The data layer **calls APIs, normalizes responses, and holds server state**. It does not handle UI, navigation, or “when to load”—callers (features/ViewModels) do.

- **service/** — HTTP transport and error types (ApiClient, ApiResponse, APIError).
- **repository/** — Shared primitives: `createActionState`, `createRepositoryStates`, `withActionState`, `OptionsStateData`.
- **Domain folders** (auth, profiles, wallet, evm, offer, etc.) — One repository per domain; each uses service + repository primitives.

## 2. Structure

```
data/
├── service/              # HTTP client and errors
│   ├── apiClient.ts
│   ├── types.ts
│   ├── handlers/apiError.ts
│   └── __tests__/
├── repository/           # Shared state primitives (not domain repos)
│   ├── repository.ts
│   └── __tests__/
├── auth/
├── profiles/
├── wallet/
├── evm/
├── earn/
├── investment/
├── offer/
├── notifications/
├── kyc/
├── accreditation/
├── filer/
├── esign/
├── settings/
├── distributions/
├── analytics/
└── 3dParty/              # External APIs (DefiLlama, Crypto/CoinGecko)
```

Each domain folder typically has:

- **\*.repository.ts** — Pinia store or composable: ApiClient, ActionStates, formatters.
- **\*.types.ts** — Domain/data types (often prefixed with `I`).
- **\*.formatter.ts** or **formatter/** — Raw API → app shapes.
- Optionally **\*.helpers.ts** for pure helpers.

### 2.1 Env → base URL

| Repository   | Env variable       | Usage |
|-------------|--------------------|--------|
| auth        | `KRATOS_URL`       | Ory Kratos (session, login, signup, recovery) |
| settings    | `KRATOS_URL`       | Ory sessions (list, delete) |
| profiles    | `USER_URL`         | User and profile API |
| wallet      | `WALLET_URL`       | Fiat wallet, transactions, Plaid link |
| evm         | `EVM_URL`          | Crypto wallet, withdraw, exchange |
| kyc         | `PLAID_URL`        | KYC/Plaid token and link |
| notifications | `NOTIFICATION_URL` | Notifications list, mark read |
| investment  | `INVESTMENT_URL`   | Investment flows, confirm, cancel |
| offer       | `OFFER_URL`        | Offers, comments, files |
| accreditation | `ACCREDITATION_URL` | Accreditation, escrow, uploads |
| filer       | `FILER_URL`        | File uploads and public files |
| esign       | `ESIGN_URL`        | E-sign flows |
| distributions | `DISTRIBUTIONS_URL` | Distributions |
| analytics   | `ANALYTIC_URL`     | Analytics events and messages |
| defillama (3dParty) | hardcoded | `https://yields.llama.fi`, `https://api.llama.fi` |
| crypto (3dParty) | hardcoded | `https://api.coingecko.com` |

## 3. Service layer (`data/service`)

| File | Role | Practices |
|------|------|------------|
| **types.ts** | `ApiResponse<T>`, `RequestConfig` | `data: T \| undefined` for 204/205; document `fatalOnServerError` and reserved `type: 'stream'`. |
| **apiClient.ts** | One client per repo (base URL from env); fetch, headers, dedup. | Typed `pendingRequests`; merge default headers with `config.headers`; GET sends no body. |
| **handlers/apiError.ts** | Structured API errors (status, body, fatal). | `responseJson` typed; callers `await error.initializeResponseJson()` before using. |

Repositories create one `new ApiClient(env.X_URL)` per domain. On error, rethrow; callers use `oryErrorHandling` or `reportError` (see **docs/ERROR_HANDLING.md**). Tests: `apiClient.test.ts`, `apiError.test.ts`.

## 4. Repository primitives (`data/repository/repository.ts`)

- **ActionState&lt;T&gt;** — `{ data: T \| undefined; loading: boolean; error: Error \| null }`.
- **OptionsStateData** — Alias for `unknown`; use for OPTIONS/unknown response state types; narrow at use site.
- **createActionState&lt;T&gt;(defaultData?)** — Returns a ref for a single action state.
- **createRepositoryStates&lt;T&gt;(config)** — One ref per config key + **resetAll()**; resets each state to `{ loading: false, error: null, data: undefined }`.
- **withActionState(stateRef, action)** — Runs async `action`, updates state (loading → data/error), rethrows. Return value = `state.data` on success.

Repos with extra state (e.g. notifications) call the factory’s `resetAll` then clear that state in their own `resetAll`.

## 5. Principles

- **Repositories = transport + state only** — API → format → set state; rethrow. No “when to load”, routing, or UI.
- **No UI in data** — Error handlers live in domain (e.g. `domain/auth/`). Repos set `state.error` and rethrow.
- **One ApiClient per repository** — Base URL from env; create inside the store/composable.
- **Errors** — Set `state.error`, clear `state.data`, rethrow. Callers use `reportError` or `oryErrorHandling`. Avoid `console.error` in repos (except analytics).
- **resetAll** — Clear every action state and any domain refs.
- **Cross-repo** — Feature layer orchestrates; avoid repo-to-repo calls; composables call multiple repos and pass params.

## 6. Best practices

| Practice | Do | Don’t |
|----------|-----|--------|
| Async actions | `withActionState(stateRef, async () => { ... })` | Try/catch/finally in every method |
| State exposure | Expose **refs** (e.g. `getAllState`) | Return `.value` (snapshot) |
| Errors | Set state, rethrow | Toasts or redirect from repos |
| ApiClient | One per repo; base URL from env | Share client or hardcode URLs |
| Thin repos | API → formatter → state; rethrow | Loading gates, routing, orchestration in data |

## 7. Adding a new domain

1. **Folder** — `data/<domain>/` (e.g. `data/payments/`).
2. **Env** — Add `X_URL` to config; document in §2.1.
3. **ApiClient** — `const apiClient = new ApiClient(env.X_URL)` in the new repo.
4. **State** — `createRepositoryStates<DomainStates>({ ... })` and `withActionState(stateRef, async () => { ... })` per async action.
5. **OPTIONS/unknown** — Type state as `OptionsStateData` or `unknown`; narrow when reading.
6. **Formatter** — `*.formatter.ts` for API → app shape; repo stays thin: API → format → state → rethrow.
7. **Orchestration** — Keep “when to load” and cross-domain flow in the feature layer.
8. **resetAll** — Clear all action states and domain refs; call factory `resetAll` then clear extra state.

## 8. Checklist for new repositories

1. `defineStore('repository-<domain>', () => { ... })` and export `useRepository<Domain>` (or composable for auth/analytics).
2. One `ApiClient(env.<SCOPE>_URL)`; relative paths for requests.
3. `createRepositoryStates<T>(config)` and `withActionState` for async operations.
4. Formatter for API → app mapping; no “when to load” or UI in data.
5. `resetAll()` clearing all action states and local refs.
6. Pinia: `acceptHMRUpdate(useRepositoryX, import.meta.hot)` for HMR.
7. Types from `InvestCommon/types/api/*` or local `*.types.ts`; avoid `as any` where known.

## 9. Error handling and boundaries

- **Repositories** — Return or throw; no toasts or navigation. Callers catch and use `oryErrorHandling` (auth/settings) or `reportError` (see **docs/ERROR_HANDLING.md**).
- **Domain** — `oryErrorHandling`, `reportError` / `toasterErrorHandling`, `oryResponseHandling` live in **domain/error/**; data layer does not re-export them.
- **Imports** — Repos may use `InvestCommon/config/env` for base URLs; no dependency on **features** or **session/profile stores** for request params—accept params from the caller.

## 10. What’s done well

- Single ApiClient with typed `ApiResponse<T>`, request dedup, merged headers.
- Unified action state (`createActionState` / `createRepositoryStates` / `withActionState`); reset and return contract documented.
- Domain-scoped repos; formatters in data; DTOs and null guards.
- Store IDs `repository-<domain>`; export `useRepository<Domain>`; composables expose refs, not `.value`.
- EVM/wallet/investment formatters use strict types; loading rules in feature layer; no repo-to-repo calls.
- **Types** — OPTIONS/unknown state use `OptionsStateData` across offer, profiles, wallet, investment, evm, accreditation; domain types in map callbacks; Plaid/auth/earn/wallet types tightened.
- **Clean code** — Immutable updates in offer/investment/profiles/wallet notification handlers; named constants (KYC, earn, EVM) for timeouts; formatter delegation (e.g. offer funded-percent).
- **Scalability** — §7 checklist for new domains; `OptionsStateData` used consistently for OPTIONS state.

## 11. What to improve

- **More repository tests** — Mock ApiClient; assert loading/error/data and `resetAll` (e.g. investment, profiles, wallet, esign).
- **Optional** — EVM `updateNotificationData` could use immutable updates for consistency with other repos.

## 12. Summary

| Aspect      | Verdict |
|------------|---------|
| Structure  | Good — domain repos, service + repository primitives. |
| Consistency| Good — reset pattern, action return contract, store ID style. |
| Type safety| Good — ApiResponse, APIError, EVM/investment types. |
| Boundaries | Good — repos rethrow; error handlers in domain. |
| Scalability| Good — one client per domain; §7 for new domains. |
| Testability| Good — service tested; more repo tests recommended. |

Error handling: **docs/ERROR_HANDLING.md**.
