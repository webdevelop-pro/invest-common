import { computed, ref, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHelloSign } from 'InvestCommon/shared/composables/useHelloSign';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_INVEST_REVIEW } from 'InvestCommon/domain/config/enums/routes';
import { ISignature, InvestStepTypes } from 'InvestCommon/types/api/invest';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

export function useInvestSignature() {
  // Hide global loader immediately
  const globalLoader = useGlobalLoader();
  globalLoader.hide();

  // Composables and stores
  const { submitFormToHubspot } = useHubspotForm('745431ff-2fed-4567-91d7-54e1c3385844');
  const { userSessionTraits } = storeToRefs(useSessionStore());
  const { onClose, onSign, openHelloSign, closeHelloSign } = useHelloSign();

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

  // Reference to the signature form instance (exposed from VFormInvestSignature)
  const formRef = ref<{
    canContinue: boolean;
    state: {
      isDialogDocumentOpen: boolean;
      checkbox1: boolean;
      checkbox2: boolean;
    };
  } | null>(null);

  // Local signId ref for managing signature state
  const signId = ref(getInvestUnconfirmedOne.value?.signature_data?.signature_id);
  
  // Computed properties
  const signUrl = computed(() => setDocumentState.value.data?.sign_url || '');
  const isLoading = computed(() => 
    setSignatureState.value.loading || 
    setDocumentState.value.loading ||
    getDocumentState.value.loading
  );
  // Mirror form-level canContinue flag so the view can easily bind footer button state
  const canContinue = computed(() => Boolean(formRef.value?.canContinue));

  // Methods
  const handleSign = async (data: ISignature): Promise<void> => {
    if (!data.signatureId || !slug.value || !id.value || !profileId.value) return;
    
    try {
      await investmentRepository.setSignature(slug.value, id.value, profileId.value, data.signatureId);
      
      if (setSignatureState.value.data && !setSignatureState.value.data.error) {
        signId.value = data.signatureId;
      }
    } catch (error) {
      console.error('Failed to set signature:', error);
    }
  };

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
      if (signId.value) {
        await esignRepository.getDocument(id.value);

        if (getDocumentState.value.data) {
          const blobUrl = URL.createObjectURL(getDocumentState.value.data);
          window.open(blobUrl, '_blank');
          // Clean up the URL after opening to prevent memory leaks
          setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        }
        return;
      }

      await esignRepository.setDocument(slug.value, id.value, profileId.value);
      
      if (setDocumentState.value.data?.sign_url && formRef.value) {
        formRef.value.state.isDialogDocumentOpen = true;
      }
    } catch (error) {
      console.error('Failed to handle document:', error);
    }
  };

  // Watch for signature ID changes and sync with local ref
  watch(
    () => getInvestUnconfirmedOne.value?.signature_data?.signature_id,
    (newSignatureId) => {
      signId.value = newSignatureId;
    },
    { immediate: true }
  );

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

  // Setup signature handler
  onSign(handleSign);

  onClose(() => {
    if (formRef.value) {
      formRef.value.state.isDialogDocumentOpen = false;
    }
  });

  const handleDialogOpen = (url: string, domEl: string): void => {
    openHelloSign(url, domEl);
  };

  const handleDialogClose = (): void => {
    closeHelloSign();
    if (formRef.value) {
      formRef.value.state.isDialogDocumentOpen = false;
    }
  };

  return {
    formRef,
    signId,
    signUrl,
    isLoading,
    canContinue,
    slug,
    id,
    profileId,
    handleSign,
    handleContinue,
    handleDocument,
    handleDialogOpen,
    handleDialogClose,
    openHelloSign,
    closeHelloSign,
    setSignatureState,
    setDocumentState,
    getDocumentState,
  };
}
