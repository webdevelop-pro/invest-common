import {
  computed, hasInjectionContext, inject,
} from 'vue';
import { storeToRefs } from 'pinia';
import {
  routeLocationKey,
  routerKey,
} from 'vue-router';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';
import {
  createHiddenKycAlertModel,
  formatKycAlertModel,
} from 'InvestCommon/data/kyc/formatter/kycAlert.formatter';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { InvestKycTypes } from 'InvestCommon/data/kyc/kyc.types';
import { urlProfileKYC } from 'InvestCommon/domain/config/links';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';

export function useKycAlertViewModel() {
  const route = hasInjectionContext()
    ? inject(routeLocationKey, null)
    : null;
  const router = hasInjectionContext()
    ? inject(routerKey, null)
    : null;
  const dialogsStore = useDialogs();
  const profilesStore = useProfilesStore();
  const {
    selectedUserProfileData,
    selectedUserProfileId,
    selectedUserProfileShowKycInitForm,
    selectedUserProfileType,
    selectedUserIndividualProfile,
  } = storeToRefs(profilesStore);
  const sessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(sessionStore);
  const repositoryKyc = useRepositoryKyc();
  const { isPlaidLoading } = storeToRefs(repositoryKyc);

  const isProfileActingAsIndividual = computed(() => (
    selectedUserProfileType.value === PROFILE_TYPES.SDIRA
    || selectedUserProfileType.value === PROFILE_TYPES.SOLO401K
  ));

  const kycProfileId = computed(() => {
    if (isProfileActingAsIndividual.value) {
      return selectedUserIndividualProfile.value?.id || selectedUserProfileId.value;
    }

    return selectedUserProfileId.value;
  });

  const alertModel = computed(() => {
    const profile = selectedUserProfileData.value;

    if (!profile) {
      return createHiddenKycAlertModel();
    }

    return formatKycAlertModel({
      status: profile.kyc_status || InvestKycTypes.none,
      isKycApproved: profile.isKycApproved,
      isPlaidLoading: isPlaidLoading.value,
    });
  });

  const onPrimaryAction = async () => {
    if (!userLoggedIn.value || !selectedUserProfileId.value || !alertModel.value.show || !alertModel.value.buttonText) {
      return;
    }

    if (selectedUserProfileShowKycInitForm.value) {
      const profileId = Number(kycProfileId.value);
      const redirect = route?.fullPath;

      if (!router) {
        if (typeof window === 'undefined') {
          return;
        }

        const url = new URL(urlProfileKYC(profileId));
        if (redirect) {
          url.searchParams.set('redirect', redirect);
        }

        window.location.assign(url.toString());
        return;
      }

      try {
        await router.push({
          path: `/profile/${profileId}/kyc`,
          query: {
            ...(route?.query ?? {}),
            ...(redirect ? { redirect } : {}),
          },
        });
        return;
      } catch {
        await router.push({
          path: `/profile/${profileId}/kyc`,
        });
        return;
      }
    }

    await repositoryKyc.handlePlaidKyc(Number(kycProfileId.value));
  };

  const onDescriptionAction = (event: Event) => {
    const target = event.target as HTMLElement | null;
    const currentTarget = event.currentTarget as HTMLElement | null;
    const contactTarget = target?.closest('[data-action="contact-us"]')
      || currentTarget?.querySelector('[data-action="contact-us"]');

    if (!contactTarget) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dialogsStore.openContactUsDialog('dashboard verification');
  };

  return {
    alertModel,
    onPrimaryAction,
    onDescriptionAction,
  };
}
