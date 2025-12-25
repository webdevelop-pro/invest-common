import { computed, type ComputedRef } from 'vue';
import { IProfileFormatted } from 'InvestCommon/data/profiles/profiles.types';

/**
 * Profile types that should have restricted wallet behavior (same as SDIRA)
 * These types: SDIRA, Solo 401k, Trust, Entity
 */
export const RESTRICTED_WALLET_PROFILE_TYPES = ['sdira', 'solo401k', 'trust', 'entity'] as const;

/**
 * Check if a profile has restricted wallet behavior
 * Profiles with restricted wallet behavior: SDIRA, Solo 401k, Trust, Entity
 * @param profileData - The profile data to check
 * @returns true if the profile type should have restricted wallet behavior
 */
export function hasRestrictedWalletBehavior(profileData: IProfileFormatted | null | undefined): boolean {
  if (!profileData) return false;
  
  return (
    profileData.isTypeSdira ||
    profileData.isTypeSolo401k ||
    profileData.isTypeTrust ||
    profileData.isTypeEntity
  );
}

/**
 * Create a computed property that checks if the current profile has restricted wallet behavior
 * @param selectedUserProfileData - Computed ref to the selected user profile data
 * @returns A computed boolean indicating if wallet should be restricted
 */
export function useHasRestrictedWalletBehavior(
  selectedUserProfileData: ComputedRef<IProfileFormatted | null | undefined>
) {
  return computed(() => hasRestrictedWalletBehavior(selectedUserProfileData.value));
}

