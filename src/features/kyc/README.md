# KYC Feature

## Current Scope

- Centralized KYC alert UI and CTA orchestration for dashboard, offers, and other consumers
- KYC init form flow for `ROUTE_SUBMIT_KYC`
- Plaid launch flow for direct KYC starts and third-party token redirects
- Post-KYC wallet continuation hook through `maybeOpenAfterKyc`
- Feature-level tests for alert, form, and third-party KYC flows

## File Map

### Views

- `invest-common/src/features/kyc/ViewKYC.vue`
  Route-level KYC form view. Keeps layout and form composition only.
- `invest-common/src/features/kyc/ViewKycThirdParty.vue`
  Route-level third-party Plaid launch result view.

### Presentation

- `invest-common/src/features/kyc/VKycAlert.vue`
  Rich alert/banner presentation for KYC states.
- `invest-common/src/features/kyc/VKycActionButton.vue`
  Button-only KYC CTA presentation.

### Feature logic

- `invest-common/src/features/kyc/logic/useKycAlertViewModel.ts`
  Shared CTA orchestration for alert/button entry points.
- `invest-common/src/features/kyc/logic/useFormFinancialInformationAndKyc.ts`
  Route-level composition entry for the KYC form flow.
- `invest-common/src/features/kyc/logic/useKycFormValidation.ts`
  Form validation + scroll-to-error behavior.
- `invest-common/src/features/kyc/logic/useKycFormWorkflow.ts`
  Shared KYC form section types and data collection helpers.
- `invest-common/src/features/kyc/logic/useKycSubmission.ts`
  Save profile, background sync, HubSpot, Plaid, and escrow orchestration.
- `invest-common/src/features/kyc/logic/useKycPostSubmitNavigation.ts`
  Profile refresh, redirect, and wallet follow-up orchestration.
- `invest-common/src/features/kyc/logic/useKycThirdParty.ts`
  Third-party KYC route state machine for token-based Plaid launches.

### Data layer

- `invest-common/src/data/kyc/kyc.types.ts`
  Shared KYC data contracts, alert types, and Plaid launch result types.
- `invest-common/src/data/kyc/formatter/kycAlert.formatter.ts`
  Pure alert/banner mapping logic.
- `invest-common/src/data/kyc/formatter/kycThirdPartyScreen.formatter.ts`
  Pure screen copy mapping for third-party KYC route states.
- `invest-common/src/data/kyc/kyc.repository.ts`
  KYC repository store, token creation, and Plaid launcher integration.

## KYC Alert Architecture

- KYC alert view data is formatted in `invest-common/src/data/kyc/formatter/kycAlert.formatter.ts`
- KYC alert types live in `invest-common/src/data/kyc/kyc.types.ts`
- KYC alert orchestration lives in `invest-common/src/features/kyc/logic/useKycAlertViewModel.ts`
- `invest-common/src/features/dashboard/composables/useDashboardPageHeader.ts` consumes the centralized KYC alert view-model instead of rebuilding banner logic locally
- `invest-common/src/features/kyc/VKycAlert.vue` and `invest-common/src/features/kyc/VKycActionButton.vue` are presentation-only surfaces over the same view-model

## KYC Alert Behavior

- If `selectedUserProfileData.value?.isKycApproved` is `true`, no KYC alert is shown
- For all non-approved statuses, alert content is built from `KycAlerts` and `KycTextStatuses`
- `declined` uses alert variant `error`
- `in_progress` uses alert variant `info`
- All other visible KYC alert states use alert variant `error`
- CTA text is derived from `KycTextStatuses`
- If the alert description contains a `data-action="contact-us"` link, clicking it opens the contact-us dialog
- Consumers should treat the CTA as actionable only when `alertModel.show` is `true` and `alertModel.buttonText` is defined

## Primary KYC Action Flow

- The main CTA entry point should go through `useKycAlertViewModel().onPrimaryAction()`
- If profile personal data is incomplete and `selectedUserProfileShowKycInitForm.value` is `true`, the user is redirected to `ROUTE_SUBMIT_KYC`
- That redirect includes `redirect` query with the current route so the user can be returned to the place where KYC was started
- If the init form is not required, the action starts Plaid directly through `handlePlaidKyc`
- SDIRA and SOLO401K flows resolve the KYC action profile ID through the linked individual profile when available

## `ROUTE_SUBMIT_KYC` Form Flow

### UI behavior

- Save button is disabled if the composed form is invalid
- While saving, the button is disabled and shows loading
- Validation covers all four form sections before any request work starts
- If validation fails, the form is not submitted and the page scrolls to the first error

### Submit sequence

1. Save the profile via `setProfileById`
2. Start non-blocking background tasks:
   user phone sync via `setUser`, then refresh via `getUser`
   HubSpot submissions for personal, financial, risk, and investment sections
3. Launch Plaid KYC via `handlePlaidKyc`
4. If there is no `escrow_id`, call `createEscrow`
5. Refresh the profile via `getProfileById`
6. Wait for the HubSpot promise before routing away
7. Return to the route from the `redirect` query or fall back to dashboard account
8. After returning, wallet post-KYC flow may continue through `maybeOpenAfterKyc`

### Error handling

- Profile save, user sync, user refresh, Plaid launch, escrow creation, and profile refresh use feature-level error reporting
- HubSpot submission failures are intentionally swallowed so they do not block the KYC flow
- Failed Plaid bootstrapping reports an error and stops the third-party flow in an `error` state
- Plaid close/exit is treated as a non-throwing incomplete outcome, not as a fatal error

## Third-Party KYC Flow

- `ViewKycThirdParty.vue` delegates state to `useKycThirdParty()`
- The token is read from `window.location.search`
- Missing token maps to `invalidToken`
- Launch-in-progress maps to `launching`
- Successful Plaid completion maps to `success`
- Plaid exit or null result maps to `incomplete`
- Thrown repository/bootstrap errors map to `error`
- Screen copy is resolved centrally by `formatKycThirdPartyScreen()`

## Plaid Repository Contract

- `createToken(profileId)` fetches a Plaid link token for standard KYC starts
- `handlePlaidKyc(profileId)` runs the full standard KYC token + Plaid flow
- `handlePlaidKycToken(linkToken)` runs Plaid directly for third-party token routes
- Plaid results return `KycPlaidLaunchResult`
- `status: 'success'` means Plaid completed successfully
- `status: 'exit'` means Plaid was closed without successful completion
- `null` means a launch token could not be resolved

## Places That Trigger KYC

- Dashboard header KYC alert
- Offer details KYC CTA in `invest-common/src/features/offers/components/OffersDetailsBtn.vue`, rendered through `invest-common/src/features/kyc/VKycActionButton.vue`
- Any future KYC CTA should reuse `useKycAlertViewModel` instead of reimplementing redirect or Plaid branching

## Test Coverage

### Feature tests

- `invest-common/src/features/kyc/__tests__/VKycAlert.test.ts`
  Covers alert presentation contract and description interaction behavior
- `invest-common/src/features/kyc/__tests__/VKycActionButton.test.ts`
  Covers the shared CTA button contract
- `invest-common/src/features/kyc/__tests__/ViewKycThirdParty.test.ts`
  Covers third-party route rendering and mount behavior

### Logic tests

- `invest-common/src/features/kyc/logic/__tests__/useKycAlertViewModel.test.ts`
  Covers centralized KYC action and contact-us orchestration
- `invest-common/src/features/kyc/logic/__tests__/useFormFinancialInformationAndKyc.test.ts`
  Covers form validation, submit flow, redirect behavior, and non-blocking background work
- `invest-common/src/features/kyc/logic/__tests__/useKycThirdParty.test.ts`
  Covers the third-party KYC route state machine

### Data tests

- `invest-common/src/data/kyc/__tests__/kyc.repository.test.ts`
  Covers direct-token Plaid launch, session matching, exit handling, and token-backed KYC launch

## Current Structural Rules

- Keep pure view-data mapping in the data layer formatters
- Keep route, redirect, and async workflow orchestration in `features/kyc/logic`
- Keep `ViewKYC.vue` and `ViewKycThirdParty.vue` thin composition surfaces
- Keep `VKycAlert.vue` and `VKycActionButton.vue` render-only
- Avoid duplicating KYC banner text, CTA logic, or redirect logic in dashboard, offers, or other consumers
- Add new KYC flow tests beside the real implementation layer they cover

## Current Log

- KYC form orchestration was split into focused composables for validation, workflow helpers, submission, and post-submit navigation
- Third-party KYC flow now uses an explicit screen formatter and route state model
- Plaid repository results now use a typed status contract instead of a raw boolean
- The old `store/useFormFinancialInformationAndKyc.ts` compatibility wrapper was removed
- The main KYC form composable test was moved from `store/__tests__` to `logic/__tests__`
