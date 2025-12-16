import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHelloSign } from 'InvestCommon/shared/composables/useHelloSign';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import { ROUTE_INVEST_REVIEW } from 'InvestCommon/domain/config/enums/routes';
import { useInvestSignature } from '../useInvestSignature';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}));

vi.mock('InvestCommon/shared/composables/useHelloSign', () => ({
  useHelloSign: vi.fn(),
}));

vi.mock('UiKit/composables/useHubspotForm', () => ({
  useHubspotForm: vi.fn(),
}));

vi.mock('UiKit/store/useGlobalLoader', () => ({
  useGlobalLoader: vi.fn(),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

vi.mock('InvestCommon/data/esign/esign.repository', () => ({
  useRepositoryEsign: vi.fn(),
}));

const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('useInvestSignature (logic)', () => {
  const mockRouter = { push: vi.fn() };
  const mockRoute = {
    params: { slug: 'test-slug', id: 'test-id', profileId: 'test-profile-id' },
  };
  const mockGlobalLoader = { hide: vi.fn() };
  const mockHubspotForm = { submitFormToHubspot: vi.fn() };
  const mockHelloSign = {
    onClose: vi.fn(),
    onSign: vi.fn(),
    openHelloSign: vi.fn(),
    closeHelloSign: vi.fn(),
  };
  const mockSessionStore = {
    userSessionTraits: ref({ email: 'test@example.com' }),
  };
  const mockInvestmentRepository = {
    setSignature: vi.fn(),
    setSignatureState: ref({ loading: false, data: { error: null } }),
    getInvestUnconfirmedOne: ref({
      signature_data: { signature_id: 'existing-signature-id' },
    }),
  };
  const mockEsignRepository = {
    setDocument: vi.fn(),
    getDocument: vi.fn(),
    setDocumentState: ref({
      loading: false,
      data: { sign_url: 'https://example.com/sign' },
    }),
    getDocumentState: ref({
      loading: false,
      data: new Blob(['pdf'], { type: 'application/pdf' }),
    }),
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockWindowOpen.mockClear();

    (useRouter as any).mockReturnValue(mockRouter);
    (useRoute as any).mockReturnValue(mockRoute);
    (useGlobalLoader as any).mockReturnValue(mockGlobalLoader);
    (useHubspotForm as any).mockReturnValue(mockHubspotForm);
    (useHelloSign as any).mockReturnValue(mockHelloSign);
    (useSessionStore as any).mockReturnValue(mockSessionStore);
    (useRepositoryInvestment as any).mockReturnValue(mockInvestmentRepository);
    (useRepositoryEsign as any).mockReturnValue(mockEsignRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes correctly and hides global loader', () => {
    const composable = useInvestSignature();

    expect(mockGlobalLoader.hide).toHaveBeenCalled();
    expect(mockHelloSign.onSign).toHaveBeenCalled();
    expect(mockHelloSign.onClose).toHaveBeenCalled();
    expect(composable.slug.value).toBe('test-slug');
    expect(composable.id.value).toBe('test-id');
    expect(composable.profileId.value).toBe('test-profile-id');
  });

  it('computes signUrl and isLoading from repository state', () => {
    const composable = useInvestSignature();

    expect(composable.signUrl.value).toBe('https://example.com/sign');
    expect(composable.isLoading.value).toBe(false);

    mockInvestmentRepository.setSignatureState.value.loading = true;
    expect(composable.isLoading.value).toBe(true);
  });

  it('handleSign sets signature and updates signId on success', async () => {
    const composable = useInvestSignature();
    const signatureData = { signatureId: 'new-signature-id' };

    await composable.handleSign(signatureData as any);

    expect(mockInvestmentRepository.setSignature).toHaveBeenCalledWith(
      'test-slug',
      'test-id',
      'test-profile-id',
      'new-signature-id',
    );
    expect(composable.signId.value).toBe('new-signature-id');
  });

  it('handleContinue navigates to review and submits Hubspot form when form canContinue', () => {
    const composable = useInvestSignature();

    composable.formRef.value = {
      canContinue: true,
      state: {
        checkbox1: true,
        checkbox2: true,
        isDialogDocumentOpen: false,
      },
    } as any;
    composable.signId.value = 'test-signature-id';

    composable.handleContinue();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: ROUTE_INVEST_REVIEW });
    expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
      email: 'test@example.com',
      invest_checkbox_1: true,
      invest_checkbox_2: true,
      sign_id: 'test-signature-id',
    });
  });

  it('handleContinue does nothing if formRef is missing or cannot continue', () => {
    const composable = useInvestSignature();

    composable.formRef.value = null;
    composable.handleContinue();

    expect(mockRouter.push).not.toHaveBeenCalled();

    composable.formRef.value = {
      canContinue: false,
      state: {
        checkbox1: false,
        checkbox2: false,
        isDialogDocumentOpen: false,
      },
    } as any;

    composable.handleContinue();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('handleDocument opens existing document when signId exists', async () => {
    const composable = useInvestSignature();
    composable.signId.value = 'existing-signature-id';

    await composable.handleDocument();

    expect(mockEsignRepository.getDocument).toHaveBeenCalledWith('test-id');
    expect(mockWindowOpen).toHaveBeenCalled();
  });

  it('handleDocument creates new document and opens dialog when no signId', async () => {
    const composable = useInvestSignature();
    composable.signId.value = null as any;

    composable.formRef.value = {
      canContinue: false,
      state: {
        checkbox1: false,
        checkbox2: false,
        isDialogDocumentOpen: false,
      },
    } as any;

    await composable.handleDocument();

    expect(mockEsignRepository.setDocument).toHaveBeenCalledWith(
      'test-slug',
      'test-id',
      'test-profile-id',
    );
    expect(composable.formRef.value?.state.isDialogDocumentOpen).toBe(true);
  });

  it('syncs signId from repository when signature_data changes', async () => {
    const composable = useInvestSignature();

    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data.signature_id = 'updated-id';
    await nextTick();

    expect(composable.signId.value).toBe('updated-id');
  });

  it('handleDialogOpen delegates to HelloSign', () => {
    const composable = useInvestSignature();
    composable.handleDialogOpen('https://example.com/sign', '#target');

    expect(mockHelloSign.openHelloSign).toHaveBeenCalledWith('https://example.com/sign', '#target');
  });

  it('handleDialogClose closes HelloSign when dialog is closed by user', () => {
    const composable = useInvestSignature();

    composable.handleDialogClose();
    expect(mockHelloSign.closeHelloSign).toHaveBeenCalled();
  });
});

