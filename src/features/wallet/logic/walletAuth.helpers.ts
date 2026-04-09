import { EvmWalletStatusTypes } from 'InvestCommon/data/evm/evm.types';
import { WalletTypes } from 'InvestCommon/data/wallet/wallet.types';

const BACKEND_READY_STATUSES = new Set<string>([
  WalletTypes.created,
  WalletTypes.verified,
  EvmWalletStatusTypes.created,
  EvmWalletStatusTypes.verified,
]);

const BACKEND_ERROR_STATUSES = new Set<string>([
  WalletTypes.error,
  WalletTypes.error_retry,
  WalletTypes.error_document,
  WalletTypes.error_pending,
  WalletTypes.error_suspended,
  EvmWalletStatusTypes.error,
  EvmWalletStatusTypes.error_retry,
  EvmWalletStatusTypes.error_document,
  EvmWalletStatusTypes.error_pending,
  EvmWalletStatusTypes.error_suspended,
]);

export const normalizeWalletProfileSlug = (value?: string | null) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_./+]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const deriveWalletAuthEmail = (
  userEmail?: string | null,
  profileName?: string | null,
  isIndividual: boolean = false,
) => {
  const email = String(userEmail ?? '').trim().toLowerCase();

  if (!email) {
    return '';
  }

  if (isIndividual) {
    return email;
  }

  const [localPart, domain] = email.split('@');
  const profileSlug = normalizeWalletProfileSlug(profileName);

  if (!localPart || !domain || !profileSlug) {
    return email;
  }

  return `${localPart}+${profileSlug}@${domain}`;
};

export const isWalletBackendReady = (status?: string | null) =>
  Boolean(status && BACKEND_READY_STATUSES.has(status));

export const isWalletBackendError = (status?: string | null) =>
  Boolean(status && BACKEND_ERROR_STATUSES.has(status));

export const shouldPromptWalletAuth = ({
  isKycApproved,
  walletStatus,
}: {
  isKycApproved?: boolean | null;
  walletStatus?: string | null;
}) => (
  Boolean(isKycApproved)
  && !isWalletBackendReady(walletStatus)
  && !isWalletBackendError(walletStatus)
);
