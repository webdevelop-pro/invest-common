import { describe, expect, it } from 'vitest';
import {
  deriveWalletAuthEmail,
  isRecoverableWalletAuthError,
  isWalletBackendError,
  isWalletBackendReady,
  isUserRejectedWalletSignatureError,
  shouldPromptWalletAuth,
} from '../walletAuth.helpers';

describe('walletAuth.helpers', () => {
  it('uses the real email for individual profiles', () => {
    expect(deriveWalletAuthEmail('User@Mail.com', 'Acme Holdings LLC', true)).toBe('user@mail.com');
  });

  it('derives a deterministic alias for non-individual profiles', () => {
    expect(deriveWalletAuthEmail('user@mail.com', ' Acme Holdings, LLC ', false)).toBe(
      'user+acme-holdings-llc@mail.com',
    );
  });

  it('treats created and verified statuses as backend-ready', () => {
    expect(isWalletBackendReady('created')).toBe(true);
    expect(isWalletBackendReady('verified')).toBe(true);
    expect(isWalletBackendReady('error')).toBe(false);
  });

  it('recognizes explicit backend error statuses', () => {
    expect(isWalletBackendError('error')).toBe(true);
    expect(isWalletBackendError('error_retry')).toBe(true);
    expect(isWalletBackendError('verified')).toBe(false);
  });

  it('prompts wallet auth only when KYC is approved and wallet is not ready', () => {
    expect(shouldPromptWalletAuth({ isKycApproved: true, walletStatus: '' })).toBe(true);
    expect(shouldPromptWalletAuth({ isKycApproved: true, walletStatus: 'verified' })).toBe(false);
    expect(shouldPromptWalletAuth({ isKycApproved: true, walletStatus: 'error' })).toBe(false);
    expect(shouldPromptWalletAuth({ isKycApproved: false, walletStatus: '' })).toBe(false);
  });

  it('classifies signer-auth errors as recoverable wallet-auth failures', () => {
    expect(isRecoverableWalletAuthError(new Error('Wallet signer is not connected.'))).toBe(true);
    expect(isRecoverableWalletAuthError(new Error('Iframe container cannot be found'))).toBe(true);
    expect(isRecoverableWalletAuthError({
      name: 'NotAuthenticatedError',
      message: 'Signer not authenticated. Please authenticate to use this signer',
    })).toBe(true);
    expect(isRecoverableWalletAuthError(new Error('User rejected signature'))).toBe(false);
  });

  it('detects explicit user-rejected signing errors', () => {
    expect(isUserRejectedWalletSignatureError(new Error('User rejected the request.'))).toBe(true);
    expect(isUserRejectedWalletSignatureError(new Error('Request rejected by backend.'))).toBe(false);
  });
});
