import { computed, ref, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { ROUTE_INVEST_REVIEW } from 'InvestCommon/domain/config/enums/routes';
import { InvestStepTypes } from 'InvestCommon/types/api/invest';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';
import env from 'InvestCommon/domain/config/env';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { reportError } from 'InvestCommon/domain/error/errorReporting';

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
  const { setCurrentUnconfirmedFilter } = investmentRepository;
  const esignRepository = useRepositoryEsign();
  const { setDocumentState, getDocumentState } = storeToRefs(esignRepository);
  const filerRepository = useRepositoryFiler();
  const { getFilesState } = storeToRefs(filerRepository);

  // Router and route
  const router = useRouter();
  const route = useRoute();
  const slug = ref((route.params.slug as string) || '');
  const id = ref((route.params.id as string) || '');
  const profileId = ref((route.params.profileId as string) || '');

  setCurrentUnconfirmedFilter({
    slug: slug.value || null,
    id: id.value ? Number(id.value) : null,
  });

  // Window opened for signUrl — close it when signId is set (user signed)
  const signWindowRef = ref<Window | null>(null);

  // Reference to the signature form instance (exposed from VFormInvestSignature)
  const formRef = ref<{
    canContinue: boolean;
    state: {
      isDialogDocumentOpen: boolean;
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
    getDocumentState.value.loading ||
    getFilesState.value.loading
  );
  // Mirror form-level canContinue flag so the view can easily bind footer button state
  const canContinue = computed(() => Boolean(formRef.value?.canContinue));

  // Methods
  const handleContinue = (): void => {
    if (!formRef.value || !formRef.value.canContinue) return;
    
    router.push({ name: ROUTE_INVEST_REVIEW });
    
    submitFormToHubspot({
      email: userSessionTraits.value?.email,
      invest_checkbox_2: formRef.value.state.checkbox2,
      sign_id: signId.value,
    });
  };

  const handleDocument = async (): Promise<void> => {
    if (!slug.value || !id.value || !profileId.value) return;
    
    try {
      // If the document is already signed, open the finalized agreement file from Filer
      if (signId.value) {
        // Try to reuse already-fetched files first; if not available,
        // fetch from Filer and then locate the agreement using the same
        // formatter logic as the Investment page.
        let source = getFilesState.value.data;
        if (!source) {
          source = await filerRepository.getFiles(id.value, 'investment');
        }
        const formattedDocuments = FilerFormatter.getFormattedInvestmentDocuments(source as any);
        const agreementDoc = formattedDocuments.find((doc: any) => {
          const url = String(doc?.url ?? '').toLowerCase();
          return url.includes('docuseal');
        }) ?? formattedDocuments.find((doc: any) => {
          const type = String(doc?.typeFormatted ?? '').toLowerCase();
          return type.includes('investment-agreements');
        }) ?? formattedDocuments[0];

        const url = agreementDoc?.url;
        if (url) {
          window.open(url, '_blank');
        }

        return;
      }

      if (!signEntityId.value) {
        await esignRepository.setDocument(slug.value, id.value);
        
      }

      if (signUrl.value) {
        signWindowRef.value = window.open(signUrl.value, '_blank') ?? null;
      }
    } catch (error) {
      reportError(error, 'Failed to handle document');
    }
  };

  // Mark checkboxes as true if step is 'review' (user came back from review step)
  const markCheckboxesIfReview = async () => {
    if (getInvestUnconfirmedOne.value?.step === InvestStepTypes.review && formRef.value) {
      await nextTick();
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

  const getInvestmentFiles = async () => {
    if (!id.value) return;
    filerRepository.getFiles(id.value, 'investment').catch((e) => {
      reportError(e, 'Failed to preload investment files');
    });
  };

  // When signId is set (user signed), close the sign tab, clear temporary setDocument data,
  // and preload investment documents from Filer so the agreement is ready to open.
  watch(
    signId,
    (newSignId) => {
      if (!newSignId) return;
      if (signWindowRef.value && !signWindowRef.value.closed) {
        signWindowRef.value.close();
        signWindowRef.value = null;
      }
      esignRepository.clearSetDocumentData();
      getInvestmentFiles();
    },
    { immediate: true },
  );

  // Clear setDocument when unconfirmed one already has entity_id (e.g. from load or WS)
  watch(
    entityIdFromInvestment,
    (entityId) => {
      if (entityId) {
        esignRepository.clearSetDocumentData();
        getInvestmentFiles();
      }
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
