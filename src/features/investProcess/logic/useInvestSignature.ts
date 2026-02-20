import { computed, ref, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_INVEST_REVIEW } from 'InvestCommon/domain/config/enums/routes';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import env from 'InvestCommon/domain/config/env';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

export function useInvestSignature() {
  // Hide global loader immediately
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  // Composables and stores
  const { submitFormToHubspot } = useHubspotForm('745431ff-2fed-4567-91d7-54e1c3385844');
  const { userSessionTraits } = storeToRefs(useSessionStore());

  // Repository stores
  const investmentRepository = useRepositoryInvestment();
  const { setSignatureState, getInvestUnconfirmedOne } = storeToRefs(investmentRepository);
  const esignRepository = useRepositoryEsign();
  const { setDocumentState, getDocumentState } = storeToRefs(esignRepository);

  // Router and route
  const router = useRouter();
  const route = useRoute();
  const slug = ref((route.params.slug as string) || '');
  const id = ref((route.params.id as string) || '');
  const profileId = ref((route.params.profileId as string) || '');

  // Window opened for signUrl — close it when signId is set (user signed)
  const signWindowRef = ref<Window | null>(null);

  // Reference to the signature form instance (exposed from VFormInvestSignature)
  const formRef = ref<{
    canContinue: boolean;
    state: {
      isDialogDocumentOpen: boolean;
      checkbox1: boolean;
      checkbox2: boolean;
    };
  } | null>(null);

  const signEntityId = computed(() => getInvestUnconfirmedOne.value?.signature_data?.entity_id
    || setDocumentState.value?.data?.entity_id);
  const signId = computed(() => getInvestUnconfirmedOne.value?.signature_data?.signature_id ?? '');
  
  // Computed properties
  const docusealBase = (env.DOCUSEAL_URL || '').replace(/\/$/, '');
  const signUrl = computed(() => {
    if (!signEntityId.value || !docusealBase) return '';
    const base = `${docusealBase}/${signEntityId.value}`;
    return id.value ? `${base}?external_id=${id.value}` : base;
  });
  const isLoading = computed(() => 
    setSignatureState.value.loading || 
    setDocumentState.value.loading ||
    getDocumentState.value.loading
  );
  // Mirror form-level canContinue flag so the view can easily bind footer button state
  const canContinue = computed(() => Boolean(formRef.value?.canContinue));

  // Methods
  const handleContinue = (): void => {
    if (!formRef.value || !formRef.value.canContinue) return;
    
    router.push({ name: ROUTE_INVEST_REVIEW });
    
    submitFormToHubspot({
      email: userSessionTraits.value?.email,
      invest_checkbox_1: formRef.value.state.checkbox1,
      invest_checkbox_2: formRef.value.state.checkbox2,
      sign_id: signId.value,
    });
  };

  const handleDocument = async (): Promise<void> => {
    if (!slug.value || !id.value || !profileId.value) return;
    
    try {

      if (!signEntityId.value) {
        await esignRepository.setDocument(slug.value, id.value);
        
      }

      if (signUrl.value) {
        signWindowRef.value = window.open(signUrl.value, '_blank') ?? null;
      }
    } catch (error) {
      console.error('Failed to handle document:', error);
    }
  };

  // Mark checkboxes as true if step is 'review' (user came back from review step)
  const markCheckboxesIfReview = async () => {
    if (getInvestUnconfirmedOne.value?.step === InvestStepTypes.review && formRef.value) {
      await nextTick();
      formRef.value.state.checkbox1 = true;
      formRef.value.state.checkbox2 = true;
    }
  };

  // Watch both step and formRef to handle all scenarios
  watch(
    [() => getInvestUnconfirmedOne.value?.step, () => formRef.value],
    markCheckboxesIfReview,
    { immediate: true }
  );

  const entityIdFromInvestment = computed(
    () => getInvestUnconfirmedOne.value?.signature_data?.entity_id ?? '',
  );

  // When signId is set (user signed), close the sign tab and clear temporary setDocument data
  watch(signId, (newSignId) => {
    if (!newSignId) return;
    if (signWindowRef.value && !signWindowRef.value.closed) {
      signWindowRef.value.close();
      signWindowRef.value = null;
    }
    esignRepository.clearSetDocumentData();
  });

  // Clear setDocument when unconfirmed one already has entity_id (e.g. from load or WS)
  watch(
    entityIdFromInvestment,
    (entityId) => {
      if (entityId) esignRepository.clearSetDocumentData();
    },
    { immediate: true },
  );

  return {
    formRef,
    signId,
    signUrl,
    isLoading,
    canContinue,
    slug,
    id,
    profileId,
    handleContinue,
    handleDocument,
    setSignatureState,
    setDocumentState,
    getDocumentState,
  };
}
