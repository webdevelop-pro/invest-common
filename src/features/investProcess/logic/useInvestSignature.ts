import { computed, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHelloSign } from 'InvestCommon/shared/composables/useHelloSign';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_INVEST_FUNDING } from 'InvestCommon/domain/config/enums/routes';
import { ISignature } from 'InvestCommon/types/api/invest';
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

  // Reactive state
  const state = ref({
    isDialogDocumentOpen: false,
    checkbox1: false,
    checkbox2: false,
  });

  // Local signId ref for managing signature state
  const signId = ref(getInvestUnconfirmedOne.value?.signature_data?.signature_id);
  
  // Computed properties
  const signUrl = computed(() => setDocumentState.value.data?.sign_url || '');
  const isLoading = computed(() => 
    setSignatureState.value.loading || 
    setDocumentState.value.loading || 
    getDocumentState.value.loading
  );
  const canContinue = computed(() => 
    state.value.checkbox1 && 
    state.value.checkbox2 && 
    Boolean(signId.value)
  );

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
    if (!canContinue.value) return;
    
    router.push({ name: ROUTE_INVEST_FUNDING });
    
    submitFormToHubspot({
      email: userSessionTraits.value?.email,
      invest_checkbox_1: state.value.checkbox1,
      invest_checkbox_2: state.value.checkbox2,
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
      
      if (setDocumentState.value.data?.sign_url) {
        state.value.isDialogDocumentOpen = true;
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

  // Setup signature handler
  onSign(handleSign);

  // Flags to avoid infinite loops when syncing closes between HelloSign and dialog
  const ignoreNextOnClose = ref(false);
  const suppressDialogCloseWatcher = ref(false);

  // When HelloSign notifies a close, ensure the dialog is closed too
  onClose(() => {
    if (ignoreNextOnClose.value) {
      // This close originated from our programmatic call to close HelloSign
      ignoreNextOnClose.value = false;
      return;
    }

    // User closed HelloSign -> close dialog but suppress watcher reaction
    suppressDialogCloseWatcher.value = true;
    state.value.isDialogDocumentOpen = false;
  });

  // When dialog closes, close HelloSign (unless the close was triggered by HelloSign)
  watch(
    () => state.value.isDialogDocumentOpen,
    (isOpen) => {
      if (!isOpen) {
        if (suppressDialogCloseWatcher.value) {
          suppressDialogCloseWatcher.value = false;
          return;
        }

        // Dialog was closed by user -> programmatically close HelloSign
        ignoreNextOnClose.value = true;
        closeHelloSign();
      }
    }
  );

  return {
    state,
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
    openHelloSign,
    closeHelloSign,
    setSignatureState,
    setDocumentState,
    getDocumentState,
  };
}
