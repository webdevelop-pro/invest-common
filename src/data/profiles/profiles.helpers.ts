import { computed, type ComputedRef } from 'vue';
import { IProfileFormatted } from './profiles.types';

/**
 * Profile types that should have restricted wallet behavior (same as SDIRA)
 * These types: SDIRA, Solo 401k, Trust, Entity
 */
export const RESTRICTED_WALLET_PROFILE_TYPES = ['sdira', 'solo401k', 'trust', 'entity'] as const;

/**
 * Check if a profile has restricted wallet behavior.
 * Profiles with restricted wallet behavior: SDIRA, Solo 401k, Trust, Entity
 */
export function hasRestrictedWalletBehavior(
  profileData: IProfileFormatted | null | undefined,
): boolean {
  if (!profileData) return false;
  return (
    profileData.isTypeSdira
    || profileData.isTypeSolo401k
    || profileData.isTypeTrust
    || profileData.isTypeEntity
  );
}

/**
 * Computed that checks if the current profile has restricted wallet behavior.
 */
export function useHasRestrictedWalletBehavior(
  selectedUserProfileData: ComputedRef<IProfileFormatted | null | undefined>,
) {
  return computed(() => hasRestrictedWalletBehavior(selectedUserProfileData.value));
}
