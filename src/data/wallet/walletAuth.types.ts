export type SignerErrorInfo = {
  message: string;
};

export type WalletSigner = {
  authenticate: (payload: unknown) => Promise<unknown>;
  validateMultiFactors: (payload: unknown) => Promise<unknown>;
  disconnect: () => Promise<void>;
  getAuthDetails: () => Promise<unknown>;
  getAddress: () => Promise<string>;
  signAuthorization?: (payload: unknown) => Promise<{
    r: `0x${string}`;
    s: `0x${string}`;
    v?: number | bigint | string;
    yParity?: number | bigint | string;
  }>;
  signTypedData?: (payload: unknown) => Promise<string>;
  signMessage?: (payload: unknown) => Promise<string>;
  on: (event: string, listener: (...args: any[]) => void) => () => void;
  inner?: {
    stampWhoami?: () => Promise<unknown>;
  };
};

export type AuthorizationSignatureRequest = {
  type?: string;
  data?: unknown;
};

export type OtpSubmissionResult = 'connected' | 'awaiting_mfa';

export type StartEmailOtpResult = 'awaiting_otp' | 'awaiting_mfa' | 'connected';

export type PendingState = {
  pendingMfaFactorId?: string;
};
