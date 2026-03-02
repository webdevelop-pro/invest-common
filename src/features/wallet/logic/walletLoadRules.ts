import type { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';
import { hasRestrictedWalletBehavior } from 'InvestCommon/data/profiles/profiles.helpers';

/**
 * Feature-layer rules for when wallet/EVM data may be loaded.
 * Keeps "when to load" out of the data layer (repositories).
 */

export function canLoadWalletData(
  profile: IProfileFormatted | null | undefined,
  selectedProfileId: number,
  userLoggedIn: boolean,
  isWalletLoading: boolean,
): boolean {
  return (
    !hasRestrictedWalletBehavior(profile)
    && (profile?.id === selectedProfileId)
    && userLoggedIn
    && !!profile?.isKycApproved
    && selectedProfileId > 0
    && !isWalletLoading
  );
}

export function canLoadEvmWalletData(
  profile: IProfileFormatted | null | undefined,
  selectedProfileId: number,
  userLoggedIn: boolean,
  isEvmLoading: boolean,
): boolean {
  return (
    !hasRestrictedWalletBehavior(profile)
    && (profile?.id === selectedProfileId)
    && userLoggedIn
    && !!profile?.isKycApproved
    && selectedProfileId > 0
    && !isEvmLoading
  );
}

export function canLoadWalletDataNotSelected(
  profile: IProfileFormatted | undefined,
  userLoggedIn: boolean,
  isWalletLoading: boolean,
): boolean {
  return (
    profile !== undefined
    && !hasRestrictedWalletBehavior(profile)
    && userLoggedIn
    && !!profile.isKycApproved
    && profile.id > 0
    && !isWalletLoading
  );
}

export function canLoadEvmWalletDataNotSelected(
  profile: IProfileFormatted | undefined,
  userLoggedIn: boolean,
  isEvmLoading: boolean,
): boolean {
  return (
    profile !== undefined
    && !hasRestrictedWalletBehavior(profile)
    && userLoggedIn
    && !!profile.isKycApproved
    && profile.id > 0
    && !isEvmLoading
  );
}
