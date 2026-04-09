### Current KYC alert architecture

- KYC alert view data is formatted in `invest-common/src/data/kyc/formatter/kycAlert.formatter.ts`
- KYC alert types live in `invest-common/src/data/kyc/kyc.types.ts`
- KYC alert orchestration lives in `invest-common/src/features/kyc/logic/useKycAlertViewModel.ts`
- `invest-common/src/features/kyc/VKycAlert.vue` is a presentational component
- `invest-common/src/features/kyc/VKycActionButton.vue` is the shared KYC CTA component for button-only entry points
- `invest-common/src/features/dashboard/composables/useDashboardPageHeader.ts` consumes the centralized KYC alert view-model instead of rebuilding KYC banner logic locally

### KYC alert behavior

- If `selectedUserProfileData.value?.isKycApproved` is `true`, no KYC alert is shown
- For all non-approved statuses, the alert model is built from `KycAlerts` and `KycTextStatuses`
- `declined` uses alert variant `error`
- `in_progress` uses alert variant `info`
- All other visible KYC alert states use alert variant `error`
- CTA text is derived from `KycTextStatuses`
- If the alert description contains a `data-action="contact-us"` link, clicking it opens the contact-us dialog
- KYC CTA availability is centralized: consumers should treat the CTA as actionable only when `alertModel.show` is `true` and `alertModel.buttonText` is defined

### KYC action flow

- The primary KYC action should go through `useKycAlertViewModel().onPrimaryAction()`
- If profile personal data is not filled and `selectedUserProfileShowKycInitForm.value` is `true`, the action redirects to `ROUTE_SUBMIT_KYC`
- That redirect includes `redirect` query with the current route so the user can be returned to the place where KYC was started
- If the init form is not required, the action starts Plaid directly through `handlePlaidKyc`
- SDIRA and SOLO401K flows resolve the KYC action profile ID through the linked individual profile when available

### Places that trigger KYC

- Dashboard header KYC alert
- Offer details KYC CTA in `invest-common/src/features/offers/components/OffersDetailsBtn.vue`, rendered through `invest-common/src/features/kyc/VKycActionButton.vue`
- Any future KYC CTA should reuse `useKycAlertViewModel` instead of reimplementing redirect or Plaid branching

### Component boundaries

- `VKycAlert.vue` renders rich alert content, contact-us description actions, and optional CTA button for banner-style surfaces
- `VKycActionButton.vue` renders only the shared KYC CTA button and delegates all action/loading/disabled behavior to `useKycAlertViewModel`
- Consumers such as offers should decide whether the KYC CTA is shown, but they should base that decision on the centralized `alertModel` rather than on duplicated profile-status checks

### Test boundaries

- `invest-common/src/features/kyc/__tests__/VKycAlert.test.ts` covers the alert presentation contract and description interaction behavior
- `invest-common/src/features/kyc/__tests__/VKycActionButton.test.ts` covers the shared CTA button contract
- `invest-common/src/features/kyc/logic/__tests__/useKycAlertViewModel.test.ts` covers the centralized KYC action and contact-us orchestration
- Consumer tests such as `invest-common/src/features/offers/components/__tests__/OffersDetailsBtn.test.ts` should verify when KYC UI is shown or hidden, not re-test the inner CTA implementation

### Flow for `ROUTE_SUBMIT_KYC`

- Save button is disabled if there is a validation error
- While saving, the button is disabled and shows loading
- On submit we validate all form sections first
- If validation fails, the form is not sent and the page scrolls to the error
- If `setProfileById` succeeds:
- We send HubSpot submissions asynchronously
- We sync user phone via `setUser`, then refresh user via `getUser`
- We start Plaid KYC via `handlePlaidKyc`
- If there is no `escrow_id`, we call `createEscrow`
- We refresh the profile via `getProfileById`
- We return to the route from the `redirect` query or fall back to dashboard account
- After returning, wallet post-KYC flow may continue through `maybeOpenAfterKyc`

### Rules for future changes

- Keep pure KYC alert mapping in the data layer formatter
- Keep router, dialog, and Plaid orchestration in the KYC feature view-model
- Keep `VKycAlert.vue` render-only
- Keep `VKycActionButton.vue` button-only
- Avoid duplicating KYC banner text or CTA logic in dashboard, offers, or other consumers
