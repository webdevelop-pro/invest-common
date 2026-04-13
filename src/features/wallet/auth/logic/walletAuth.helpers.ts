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

const tryParseJson = (value: string) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const extractWalletAuthErrorMessage = (error: unknown): string => {
  if (!error) {
    return '';
  }

  if (typeof error === 'string') {
    const parsed = tryParseJson(error);
    if (parsed) {
      return extractWalletAuthErrorMessage(parsed);
    }

    return error.trim();
  }

  if (error instanceof Error) {
    return extractWalletAuthErrorMessage({
      message: error.message,
      name: error.name,
      cause: error.cause,
    });
  }

  if (typeof error !== 'object') {
    return '';
  }

  const errorRecord = error as Record<string, unknown>;
  const nestedCandidates = [
    errorRecord.message,
    errorRecord.error,
    errorRecord.details,
    errorRecord.cause,
  ];

  for (const candidate of nestedCandidates) {
    const message = extractWalletAuthErrorMessage(candidate);
    if (message) {
      return message;
    }
  }

  return '';
};

export const resolveWalletAuthErrorMessage = (
  error: unknown,
  fallbackMessage: string,
) => extractWalletAuthErrorMessage(error) || fallbackMessage;

const normalizeErrorMessage = (error?: unknown) => {
  const errorLike = error as Error | undefined;

  return `${String(errorLike?.name ?? '').trim()} ${String(errorLike?.message ?? error ?? '').trim()}`
    .trim()
    .toLowerCase();
};

export const isUserRejectedWalletSignatureError = (error?: unknown) => {
  const message = normalizeErrorMessage(error);

  return [
    'user rejected',
    'user denied',
    'rejected the request',
    'signature rejected',
    'cancelled',
    'canceled',
  ].some((pattern) => message.includes(pattern));
};

export const isRecoverableWalletAuthError = (error?: unknown) => {
  const message = normalizeErrorMessage(error);

  if (!message) {
    return false;
  }

  if (isUserRejectedWalletSignatureError(error)) {
    return false;
  }

  return [
    'notauthenticatederror',
    'not authenticated',
    'signer not authenticated',
    'please authenticate',
    'authentication failed',
    'wallet auth',
    'wallet signer',
    'not connected',
    'disconnected',
    'session expired',
    'expired session',
    'iframe container cannot be found',
    'missing signer',
    'no signer',
  ].some((pattern) => message.includes(pattern));
};
