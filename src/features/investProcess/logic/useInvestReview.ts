import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_INVEST_THANK } from 'InvestCommon/domain/config/enums/routes';
import { storeToRefs } from 'pinia';
import { urlOfferSingle } from 'InvestCommon/domain/config/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';
import { useSendAnalyticsEvent } from 'InvestCommon/domain/analytics/useSendAnalyticsEvent';

export function useInvestReview() {
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  const route = useRoute();
  const router = useRouter();
  const { slug, id, profileId } = route.params;

  const profilesStore = useProfilesStore();
  const { selectedUserProfileData } = storeToRefs(profilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);
  const investmentRepository = useRepositoryInvestment();
  const { getInvestUnconfirmedOne, setReviewState } = storeToRefs(investmentRepository);
  const { sendEvent } = useSendAnalyticsEvent();

  const { submitFormToHubspot } = useHubspotForm('23d573ec-3714-4fdb-97c2-a3b688d5008f');

  // Computed properties
  const investorName = computed(() => {
    const { first_name, middle_name, last_name } = selectedUserProfileData.value?.data || {};
    return [first_name, middle_name, last_name].filter(Boolean).join(' ');
  });
  const isSsnHidden = computed(() => selectedUserProfileData.value?.data?.is_full_ssn_provided === true);

  const fundingSourceDataToShow = computed(() => {
    const fundingType = getInvestUnconfirmedOne.value?.funding_type;
    if (!fundingType) return '';
    
    if (fundingType.toLowerCase() === FundingTypes.cryptoWallet) {
      return 'Crypto Wallet';
    }
    
    if (fundingType.toLowerCase().includes('wallet')) {
      return fundingType.charAt(0).toUpperCase() + fundingType.slice(1);
    }
    return fundingType.toUpperCase();
  });

  const confirmInvest = async () => {
    await investmentRepository.setReview(slug as string, id as string, profileId as string);
    void sendEvent({
      event_type: 'send',
      method: 'POST',
      httpRequestMethod: 'POST',
      service_name: 'vue3-app',
      request_path: route.path,
    });
  };

  // Handle successful investment review
  investmentRepository.$onAction(({ name, after }) => {
    after(() => {
      if (name === 'setReview' && setReviewState.value.data?.investment) {
        const investment = setReviewState.value.data.investment;
        
        router.push({
          name: ROUTE_INVEST_THANK,
          params: { id: investment.id },
        });

        submitFormToHubspot({
          email: userSessionTraits.value?.email,
          investment_id: investment.id,
          offer_name: getInvestUnconfirmedOne.value?.offer?.name,
          offer_slug: getInvestUnconfirmedOne.value?.offer?.slug,
          investment_status: investment.status,
        });
      }
    });
  });

  return {
    // Route params
    slug,
    id,
    profileId,
    
    // Store data
    selectedUserProfileData,
    getInvestUnconfirmedOne,
    setReviewState,
    
    // Computed properties
    investorName,
    fundingSourceDataToShow,
    isSsnHidden,
    
    // Methods
    confirmInvest,
    
    // Utilities
    urlOfferSingle,
  };
}
