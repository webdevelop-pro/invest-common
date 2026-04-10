# Wallet Integration

## Current Phase
- Frontend wallet auth flow is implemented for the OTP-first bind flow.
- Wallet setup is gated by KYC approval.
- Backend wallet creation and wallet status remain the source of truth.
- Frontend authenticates the user with Alchemy, then binds the authenticated wallet user to our `profile_id`.
- Frontend still does not execute onchain wallet actions directly.

This document now describes the current implemented phase, not the original target-state proposal.

## Implemented Scope
- Alchemy email OTP wallet authentication.
- Optional Alchemy MFA continuation step when required by signer status.
- Resumable wallet-auth dialog state per `profile_id`.
- Automatic wallet-auth prompt after KYC redirect when wallet setup is still needed.
- Manual wallet setup triggers from wallet alerts and dashboard wallet CTAs.
- Backend bind step using stamped whoami plus wallet metadata required by the current API.
- Error handling aligned with current UI patterns:
  - dialog/auth errors use toaster notifications
  - wallet setup required uses wallet alert/CTA UX
  - generic EVM `not found` wallet-setup cases do not show the global error toaster

## Important Files
- KYC post-submit trigger:
  [`invest-common/src/features/kyc/logic/useFormFinancialInformationAndKyc.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/kyc/logic/useFormFinancialInformationAndKyc.ts)
- Wallet auth store/state machine:
  [`invest-common/src/features/wallet/store/useWalletAuth.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/store/useWalletAuth.ts)
- Wallet auth dialog:
  [`invest-common/src/features/wallet/components/VDialogWalletAuth.vue`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/components/VDialogWalletAuth.vue)
- Alchemy adapter:
  [`invest-common/src/features/wallet/logic/walletAuth.adapter.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/logic/walletAuth.adapter.ts)
- Wallet alert classification:
  [`invest-common/src/features/wallet/logic/useWalletAlert.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/logic/useWalletAlert.ts)
- Wallet setup-required error helper:
  [`invest-common/src/features/wallet/logic/walletSetupError.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/logic/walletSetupError.ts)
- Wallet fetch / generic error suppression:
  [`invest-common/src/features/wallet/logic/useWallet.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/logic/useWallet.ts)
- Dashboard wallet banner trigger:
  [`invest-common/src/features/dashboard/composables/useDashboardPageHeader.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/dashboard/composables/useDashboardPageHeader.ts)

## Trigger Points

### After KYC
- `handleSave()` still completes KYC and performs the existing redirect first.
- After `await router.push(backButtonRoute.value)`, the code calls `walletAuthStore.maybeOpenAfterKyc(...)`.
- `maybeOpenAfterKyc(...)` only opens the dialog automatically when:
  - the profile is KYC-approved
  - wallet auth is still needed
  - backend wallet status is not already ready

### Manual “Set Up Wallet” CTAs
- The wallet-tab alert CTA calls `walletAuthStore.startFlowForProfile(...)` directly.
- The dashboard wallet banner CTA also calls `walletAuthStore.startFlowForProfile(...)` directly.
- Fresh setup clicks should immediately send the OTP email.
- Resumable flows can still reopen the dialog at the current step instead of restarting.

## Current Frontend Flow

### Store steps
Current dialog/store steps:
- `intro`
- `sending_otp`
- `awaiting_otp`
- `awaiting_mfa`
- `binding`
- `success`
- `error`

### Actual behavior
1. User reaches a wallet setup trigger.
2. Frontend derives the wallet-auth email.
3. Frontend opens the wallet dialog.
4. Frontend starts Alchemy email OTP immediately.
5. Dialog moves to `awaiting_otp` when signer reaches OTP/email-auth state.
6. User submits OTP.
7. If MFA is required, dialog moves to `awaiting_mfa`.
8. After auth completes, frontend fetches auth details and stamped whoami data.
9. Frontend calls backend wallet register endpoint.
10. Frontend refreshes profile + EVM wallet data.
11. Dialog moves to `success`.

## Email Rules
- Individual profiles use the real user email.
- Non-individual profiles use a deterministic alias derived from the user email and normalized profile name.
- Email derivation logic lives in wallet auth helpers and is used through the store, not inline in the dialog.

## Alchemy Signer Notes
- Signer is created with `iframeContainerId: 'alchemy-signer-iframe-container'`.
- Before creating the signer, the adapter now waits for the iframe container to exist in the DOM.
- If signer creation fails, cached signer state is cleared so retry works on the next attempt.
- Adapter currently wraps:
  - `startEmailOtp`
  - `submitOtp`
  - `submitMfa`
  - `getAuthDetails`
  - `getStampedWhoamiRequest`

## Current Backend Bind Contract

### Register endpoint
Current frontend bind request for:
`/auth/wallet/register/:profileId`

Payload:
```json
{
  "profile_id": 1122,
  "provider_name": "alchemy",
  "wallet_address": "0x...",
  "stamped_whoami_request": {}
}
```

### Notes
- `profile_id` remains the public identifier. Do not introduce `wallet_id` for this flow.
- `provider_name` is currently required by the live backend.
- `wallet_address` is taken from `walletAuthAdapter.getAuthDetails()`.
- `stamped_whoami_request` is still generated from `signer.inner.stampWhoami()`.

## Wallet Alert Behavior

### Architecture
- `useWalletAlert.ts` is the single source of truth for wallet alert classification, CTA routing, bank-account link handling, contact-us actions, and loading state.
- `DashboardWalletAlert.vue` is now presentation-only and consumes the shared view-model output the same way `VKycAlert.vue` does for KYC.
- Dashboard wallet surfaces should reuse `useWalletAlert()` instead of rebuilding wallet alert actions locally.

### Setup required
- If EVM wallet fetch fails with a wallet-setup-required backend case such as `not found` / `create wallet`, frontend treats it as a setup-required state, not a generic fatal wallet error.
- This state shows wallet setup copy and a `Set Up Wallet` CTA.
- This specific case should not trigger the generic global error toaster.

### Wallet creation / pending
- Backend-driven wallet creation state still shows the info alert:
  `Your wallet is being created and verified.`

### Hard wallet errors
- True backend wallet errors still use the existing wallet error alert path and `contact us` copy.

## Dialog UX Rules
- First useful visible step after a wallet setup click should be OTP entry, not a passive intro-only screen.
- Inline dialog error banners were removed for auth errors.
- Wallet auth errors now use the project toaster pattern with:
  `Wallet Setup Needs Attention`
- OTP validation failures keep the user on the OTP input step.
- MFA validation failures keep the user on the MFA input step.

## Current Limitations / Open Work
- API docs/spec still lag behind the current backend register payload; this doc reflects actual implemented behavior.
- Current docs elsewhere may still mention register payloads with only `stamped_whoami_request`.
- Frontend smart-account execution is still out of scope.
- Withdrawal/exchange authorization signing flow is still not implemented as part of this phase.
- MFA enrollment management UI is still out of scope.

## Out of Scope For This Phase
- Frontend transaction broadcasting
- Frontend smart-account execution
- Withdrawal contract migration
- Exchange signing flow
- MFA enrollment management UI
- Any flow that uses `wallet_id` as the public identifier

## Reference Docs
- API docs: https://apidocs.webdevelop.biz/#tag/AuthCryptoWallet
- Alchemy Email OTP: https://www.alchemy.com/docs/wallets/signer/authentication/email-otp
- Alchemy MFA: https://www.alchemy.com/docs/wallets/signer/authentication/mfa
- UI kit: https://ui-kit.webdevelop.pro
