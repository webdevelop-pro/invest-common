# Wallet Auth Feature

This folder contains the frontend wallet-auth flow used to connect an Alchemy-backed wallet to a profile.

The feature supports two UI shells:
- dialog flow via [`VDialogWalletAuth.vue`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/VDialogWalletAuth.vue)
- standalone page flow via [`ViewWalletAuthOtp.vue`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/ViewWalletAuthOtp.vue)

Both shells run through the same shared logic in [`useWalletAuthSharedFlow.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useWalletAuthSharedFlow.ts) and the Pinia store [`useWalletAuth.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/store/useWalletAuth.ts).

## File Roles
- [`composables/useWalletAuthSharedFlow.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useWalletAuthSharedFlow.ts): shared presentation and submit logic for both dialog and page flows
- [`composables/useVDialogWalletAuth.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useVDialogWalletAuth.ts): dialog-specific sync with modal open state and toast errors
- [`composables/useWalletAuthOtpPage.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useWalletAuthOtpPage.ts): page-specific route startup and post-success redirect handling
- [`components/VFormWalletAuthOtp.vue`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/components/VFormWalletAuthOtp.vue): reusable OTP/MFA form UI
- [`../../data/wallet/walletAuth.adapter.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/data/wallet/walletAuth.adapter.ts): data-layer adapter around the Alchemy signer SDK
- [`../../data/wallet/walletAuth.types.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/data/wallet/walletAuth.types.ts): wallet-auth transport and adapter types
- [`logic/walletAuth.helpers.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/logic/walletAuth.helpers.ts): email derivation, wallet-status checks, and auth-error classification helpers

## High-Level Flow
1. A trigger provides a `WalletAuthOpenPayload` for a `profileId`.
2. The shared flow builds the payload from the selected profile and current user session.
3. The store derives the wallet-auth email:
   - individual profile: original user email
   - non-individual profile: aliased email like `local+profile-slug@domain`
4. The store starts Alchemy email OTP auth with `walletAuthAdapter.startEmailOtp(email)`.
5. The adapter resolves one of three auth states:
   - `awaiting_otp`
   - `awaiting_mfa`
   - `connected`
6. If OTP is required, the user submits the email code.
7. If MFA is required, the user submits the authenticator code.
8. After auth succeeds, the store performs wallet bind:
   - reads signer auth details
   - reads stamped whoami payload
   - calls `evmRepository.registerWallet(...)`
   - warms the signer with a zero transaction
   - refreshes profile and wallet data
9. The store marks the flow as `success`.

## State Machine
The store uses these steps:
- `intro`
- `sending_otp`
- `awaiting_otp`
- `awaiting_mfa`
- `binding`
- `success`
- `error`

Typical transitions:

```text
intro
  -> sending_otp
  -> awaiting_otp
  -> awaiting_mfa
  -> connected

awaiting_otp
  -> sending_otp
  -> awaiting_mfa
  -> binding
  -> error on invalid OTP or bind failure

awaiting_mfa
  -> binding
  -> error on invalid MFA or finalize failure

binding
  -> success
  -> error

error
  -> retryCurrentStep()
```

Notes:
- `sending_otp` is also reused while OTP is being submitted.
- `connected` is an adapter result, not a persisted store step.
- `binding` means auth already succeeded and frontend is finishing backend registration plus refresh.

## Shared Flow Responsibilities
[`useWalletAuthSharedFlow.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useWalletAuthSharedFlow.ts) is the feature-level view model.

It is responsible for:
- exposing the current title, description, button text, and input copy
- switching the input model between OTP and MFA code
- deciding whether submit should start the flow, submit OTP, submit MFA, retry, or finish success handling
- always starting from a fresh email OTP flow when wallet auth is triggered again

This keeps dialog and page behavior aligned.

## Dialog Flow
[`useVDialogWalletAuth.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useVDialogWalletAuth.ts) adds dialog-only behavior on top of the shared flow:
- syncs store-driven dialog open state with the component `open` model
- closes the wallet-auth dialog in the store when the modal closes
- shows auth errors as toasts while the dialog is open
- closes the dialog automatically after a successful final submit

In the dialog, code-entry steps render the shared form. Non-code steps render descriptive text with footer actions.

## Page Flow
[`useWalletAuthOtpPage.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/composables/useWalletAuthOtpPage.ts) starts the same flow from route params.

Page-only behavior:
- hydrates flow context on mount using `route.params.profileId`
- restarts if `profileId` changes
- hides the global loader immediately
- if success is reached and `?next=kyc` is present, redirects to `urlProfileKYC(profileId)`
- surfaces the retry button when the current step is `error`
- auto-starts a fresh email OTP flow for the current profile

## Start And Retry Rules
- Triggering wallet auth always resets the profile flow to the beginning.
- The store derives the email again and starts `walletAuthAdapter.startEmailOtp(email)`.
- Retry from the `error` step also restarts the email OTP flow from the beginning.
- The flow is kept in Pinia state for the current session only; it is not resumed from persisted local storage.

## Adapter Contract
[`walletAuth.adapter.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/data/wallet/walletAuth.adapter.ts) owns signer lifecycle and SDK-specific details.

Key methods:
- `startEmailOtp(email)`
- `submitOtp(otpCode)`
- `submitMfa(multiFactorCode)`
- `getAuthDetails()`
- `getStampedWhoamiRequest()`
- `warmSignerWithZeroTransaction()`
- `sendZeroTransaction()`
- `resetSession()`

Important implementation details:
- the signer waits for the DOM iframe container before creation
- signer instance and pending MFA factor are cached between steps
- cache is cleared on reset or failed signer creation
- EIP-7702 warmup is done with a zero-value transaction after registration succeeds

## Helper Rules
[`walletAuth.helpers.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/logic/walletAuth.helpers.ts) contains the reusable business rules:
- `deriveWalletAuthEmail(...)`
- `shouldPromptWalletAuth(...)`
- `isWalletBackendReady(...)`
- `isWalletBackendError(...)`
- `isRecoverableWalletAuthError(...)`

`shouldPromptWalletAuth(...)` is the guard used by the wider wallet feature to decide whether wallet setup should be shown after KYC or other wallet-required entry points.

## Integration Points Outside This Folder
- Store/state machine: [`store/useWalletAuth.ts`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/auth/store/useWalletAuth.ts)
- KYC-triggered auto-open and wallet setup rules are documented in [`../README.md`](/Users/nelyaklyusa/Documents/work-code/dashboard.webdevelop.biz/invest-common/src/features/wallet/README.md)

## Short Example
Fresh dialog start:

```text
CTA click
  -> startFlowForProfile(payload)
  -> open dialog
  -> startEmailOtp(email)
  -> awaiting_otp
  -> submitOtp(code)
  -> awaiting_mfa or binding
  -> finalize bind
  -> success
```

Re-triggered flow:

```text
reopen dialog/page for same profile
  -> ensureWalletAuthFlow(profileId)
  -> reset flow to intro with current email
  -> startEmailOtp(email)
  -> awaiting_otp / awaiting_mfa / connected
```
