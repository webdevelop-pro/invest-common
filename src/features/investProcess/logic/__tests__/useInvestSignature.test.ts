import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
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

vi.mock('InvestCommon/domain/config/env', () => ({
  default: { DOCUSEAL_URL: 'https://docuseal-web.webdevelop.biz/s' },
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
  const mockSessionStore = {
    userSessionTraits: ref({ email: 'test@example.com' }),
  };
  const mockInvestmentRepository = {
    setSignature: vi.fn(),
    setSignatureState: ref({ loading: false, data: { error: null } }),
    getInvestUnconfirmedOne: ref({
      signature_data: { signature_id: 'sig-1', entity_id: 'doc-entity-123' },
    }),
  };
  const mockEsignRepository = {
    setDocument: vi.fn().mockResolvedValue({ entity_id: 'new-entity-id' }),
    getDocument: vi.fn(),
    setDocumentState: ref({
      loading: false,
      data: undefined as { entity_id?: string } | undefined,
    }),
    getDocumentState: ref({
      loading: false,
      data: null as Blob | null,
    }),
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      signature_data: { signature_id: 'sig-1', entity_id: 'doc-entity-123' },
    };
    mockEsignRepository.setDocumentState.value = { loading: false, data: undefined };

    (useRouter as any).mockReturnValue(mockRouter);
    (useRoute as any).mockReturnValue(mockRoute);
    (useGlobalLoader as any).mockReturnValue(mockGlobalLoader);
    (useHubspotForm as any).mockReturnValue(mockHubspotForm);
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
    expect(composable.slug.value).toBe('test-slug');
    expect(composable.id.value).toBe('test-id');
    expect(composable.profileId.value).toBe('test-profile-id');
  });

  it('computes signId from signature_data.entity_id or setDocumentState.data.entity_id', () => {
    const composable = useInvestSignature();

    expect(composable.signId.value).toBe('doc-entity-123');

    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data!.entity_id = 'other-entity';
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      ...mockInvestmentRepository.getInvestUnconfirmedOne.value,
    };
    // composable uses refs from store, so need new composable to see updated store
    const composable2 = useInvestSignature();
    expect(composable2.signId.value).toBe('other-entity');
  });

  it('computes signUrl as DOCUSEAL_URL (env has /s) + /{entity_id}?external_id={id}', () => {
    const composable = useInvestSignature();

    expect(composable.signUrl.value).toBe('https://docuseal-web.webdevelop.biz/s/doc-entity-123?external_id=test-id');

    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data = { signature_id: '', entity_id: '' };
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      ...mockInvestmentRepository.getInvestUnconfirmedOne.value,
    };
    const composable2 = useInvestSignature();
    expect(composable2.signUrl.value).toBe('');
  });

  it('computes isLoading from setSignatureState, setDocumentState, getDocumentState', () => {
    const composable = useInvestSignature();

    expect(composable.isLoading.value).toBe(false);

    mockEsignRepository.setDocumentState.value.loading = true;
    expect(composable.isLoading.value).toBe(true);
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

    composable.handleContinue();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: ROUTE_INVEST_REVIEW });
    expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
      email: 'test@example.com',
      invest_checkbox_1: true,
      invest_checkbox_2: true,
      sign_id: 'doc-entity-123',
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

  it('handleDocument opens signUrl in new tab when signEntityId already exists', async () => {
    const composable = useInvestSignature();

    await composable.handleDocument();

    expect(mockEsignRepository.setDocument).not.toHaveBeenCalled();
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://docuseal-web.webdevelop.biz/s/doc-entity-123?external_id=test-id',
      '_blank',
    );
  });

  it('handleDocument calls setDocument then opens signUrl when no signEntityId', async () => {
    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data = { signature_id: '', entity_id: '' };
    mockEsignRepository.setDocumentState.value = { loading: false, data: undefined };
    mockEsignRepository.setDocument.mockImplementation(async () => {
      mockEsignRepository.setDocumentState.value = { loading: false, data: { entity_id: 'new-entity-id' } };
      return { entity_id: 'new-entity-id' };
    });

    const composable = useInvestSignature();

    await composable.handleDocument();

    expect(mockEsignRepository.setDocument).toHaveBeenCalledWith(
      'test-slug',
      'test-id',
      'test-profile-id',
    );
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://docuseal-web.webdevelop.biz/s/new-entity-id?external_id=test-id',
      '_blank',
    );
  });

  it('handleDocument does nothing when slug, id or profileId is missing', async () => {
    (useRoute as any).mockReturnValue({ params: { slug: '', id: 'test-id', profileId: 'test-profile-id' } });
    const composable = useInvestSignature();

    await composable.handleDocument();

    expect(mockEsignRepository.setDocument).not.toHaveBeenCalled();
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it('syncs signId from setDocumentState.data.entity_id after setDocument', async () => {
    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data = { signature_id: '', entity_id: '' };
    mockEsignRepository.setDocumentState.value = { loading: false, data: { entity_id: 'from-set-document' } };

    const composable = useInvestSignature();

    expect(composable.signId.value).toBe('from-set-document');
  });
});
