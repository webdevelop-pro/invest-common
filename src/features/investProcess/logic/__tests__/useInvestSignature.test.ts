import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { ROUTE_INVEST_REVIEW, ROUTE_ACCREDITATION_UPLOAD } from 'InvestCommon/domain/config/enums/routes';
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

// Shared profile refs so tests can manipulate accreditation state
const mockSelectedUserProfileData = ref<any>(null);
const mockSelectedUserProfileId = ref<number | null>(null);

vi.mock('InvestCommon/domain/profiles/store/useProfiles', () => ({
  useProfilesStore: vi.fn(() => ({
    selectedUserProfileData: mockSelectedUserProfileData,
    selectedUserProfileId: mockSelectedUserProfileId,
  })),
}));

vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: vi.fn(),
}));

vi.mock('InvestCommon/data/esign/esign.repository', () => ({
  useRepositoryEsign: vi.fn(),
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: vi.fn(),
}));

vi.mock('InvestCommon/data/filer/filer.formatter', () => ({
  FilerFormatter: {
    // Always return a single formatted investment agreement document
    getFormattedInvestmentDocuments: vi.fn(() => ([
      {
        url: 'https://files.example.com/investment-agreement.pdf',
        typeFormatted: 'Investment-Agreements',
      },
    ])),
  },
}));

vi.mock('InvestCommon/config/env', () => ({
  default: { DOCUSEAL_URL: 'https://docuseal-web.webdevelop.biz/s' },
}));

const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

describe('useInvestSignature (logic)', () => {
  const mockRouter = {
    push: vi.fn(),
    currentRoute: { value: { fullPath: '/current/path' } },
  };
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
    setCurrentUnconfirmedFilter: vi.fn(),
    getInvestUnconfirmedOne: ref({
      id: 1,
      signature_data: { signature_id: 'sig-1', entity_id: 'doc-entity-123' },
    }),
  };
  const mockEsignRepository = {
    setDocument: vi.fn().mockResolvedValue({ entity_id: 'new-entity-id' }),
    getDocument: vi.fn(),
    clearSetDocumentData: vi.fn(),
    setDocumentState: ref({
      loading: false,
      data: undefined as { entity_id?: string } | undefined,
    }),
    getDocumentState: ref({
      loading: false,
      data: null as Blob | null,
    }),
  };
  const mockFilerRepository = {
    getFilesState: ref({
      loading: false,
      error: null,
      data: undefined,
    }),
    getFiles: vi.fn().mockResolvedValue([
      {
        id: 1,
        url: 'https://files.example.com/investment-agreement.pdf',
        'object-type': 'investment-agreements',
      },
    ]),
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockWindowOpen.mockClear();
    mockSelectedUserProfileData.value = null;
    mockSelectedUserProfileId.value = null;
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      id: 1,
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
    (useRepositoryFiler as any).mockReturnValue(mockFilerRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes correctly, hides global loader and sets unconfirmed filter by slug and id', () => {
    const composable = useInvestSignature();

    expect(mockGlobalLoader.hide).toHaveBeenCalled();
    expect(composable.slug.value).toBe('test-slug');
    expect(composable.id.value).toBe('test-id');
    expect(composable.profileId.value).toBe('test-profile-id');
    expect(mockInvestmentRepository.setCurrentUnconfirmedFilter).toHaveBeenCalledWith({
      slug: 'test-slug',
      id: NaN,
    });
  });

  it('computes signId from signature_data.signature_id only (validate by signature_id, not entity_id)', () => {
    const composable = useInvestSignature();

    expect(composable.signId.value).toBe('sig-1');

    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data!.signature_id = 'other-sig';
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      ...mockInvestmentRepository.getInvestUnconfirmedOne.value,
    };
    const composable2 = useInvestSignature();
    expect(composable2.signId.value).toBe('other-sig');
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

  it('computes accreditation gating flags and alert text correctly', () => {
    // 506(c) offer with new accreditation → button shown, signature enabled
    mockInvestmentRepository.getInvestUnconfirmedOne.value.offer = {
      isRegD506cOffer: true,
    } as any;
    mockSelectedUserProfileData.value = {
      isAccreditationNew: true,
      isAccreditationExpired: false,
      isAccreditationInfoRequired: false,
      isAccreditationPending: false,
    };

    const composable = useInvestSignature();

    expect(composable.showAccreditationButton.value).toBe(true);
    expect(composable.isSignatureDisabled.value).toBe(false);
    expect(composable.accreditationAlertText.value)
      .toBe('This is a 506(c) offering. SEC regulations require APPROVED accreditation verification before signing documents.');

    // Pending accreditation → button hidden, signature disabled, same alert
    mockSelectedUserProfileData.value = {
      isAccreditationNew: false,
      isAccreditationExpired: false,
      isAccreditationInfoRequired: false,
      isAccreditationPending: true,
    };

    expect(composable.showAccreditationButton.value).toBe(false);
    expect(composable.isSignatureDisabled.value).toBe(true);
    expect(composable.accreditationAlertText.value)
      .toBe('This is a 506(c) offering. SEC regulations require APPROVED accreditation verification before signing documents.');
  });

  it('handleContinue navigates to review and submits Hubspot form when form canContinue', () => {
    const composable = useInvestSignature();

    composable.formRef.value = {
      canContinue: true,
      state: {
        checkbox2: true,
        isDialogDocumentOpen: false,
      },
    } as any;

    composable.handleContinue();

    expect(mockRouter.push).toHaveBeenCalledWith({ name: ROUTE_INVEST_REVIEW });
    expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
      email: 'test@example.com',
      invest_checkbox_2: true,
      sign_id: 'sig-1',
    });
  });

  it('handleAccreditationClick navigates to accreditation upload with redirect to current route', () => {
    (useRoute as any).mockReturnValue({
      params: { slug: 'test-slug', id: 'test-id', profileId: '123' },
    });
    mockSelectedUserProfileId.value = 999;

    const composable = useInvestSignature();

    composable.handleAccreditationClick();

    expect(mockRouter.push).toHaveBeenCalledWith({
      name: ROUTE_ACCREDITATION_UPLOAD,
      params: { profileId: 123 },
      query: {
        redirect: '/current/path',
      },
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
        checkbox2: false,
        isDialogDocumentOpen: false,
      },
    } as any;
    composable.handleContinue();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('handleDocument opens finalized investment agreement from Filer when document is signed', async () => {
    const composable = useInvestSignature();

    await composable.handleDocument();

    expect(mockEsignRepository.setDocument).not.toHaveBeenCalled();
    expect(mockFilerRepository.getFiles).toHaveBeenCalledWith('test-id', 'investment');
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://files.example.com/investment-agreement.pdf',
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

  it('handleDocument does nothing when signature is disabled by accreditation', async () => {
    mockInvestmentRepository.getInvestUnconfirmedOne.value.offer = {
      isRegD506cOffer: true,
    } as any;
    mockSelectedUserProfileData.value = {
      isAccreditationNew: false,
      isAccreditationExpired: false,
      isAccreditationInfoRequired: false,
      isAccreditationPending: true,
    };

    const composable = useInvestSignature();

    await composable.handleDocument();

    expect(composable.isSignatureDisabled.value).toBe(true);
    expect(mockEsignRepository.setDocument).not.toHaveBeenCalled();
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it('signId is from signature_data.signature_id only; setDocument entity_id does not set signId', () => {
    mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data = { signature_id: '', entity_id: 'doc-entity-from-set' };
    mockEsignRepository.setDocumentState.value = { loading: false, data: { entity_id: 'from-set-document' } };

    const composable = useInvestSignature();

    expect(composable.signId.value).toBe('');
  });

  it('calls clearSetDocumentData on init when unconfirmed one has entity_id (immediate watcher)', () => {
    mockEsignRepository.clearSetDocumentData.mockClear();
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      signature_data: { signature_id: '', entity_id: 'doc-entity-123' },
    } as any;

    useInvestSignature();

    expect(mockEsignRepository.clearSetDocumentData).toHaveBeenCalled();
  });

  it('calls clearSetDocumentData when signId becomes set', async () => {
    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      signature_data: { signature_id: '', entity_id: 'doc-entity-123' },
    } as any;

    useInvestSignature();
    mockEsignRepository.clearSetDocumentData.mockClear();

    mockInvestmentRepository.getInvestUnconfirmedOne.value = {
      ...mockInvestmentRepository.getInvestUnconfirmedOne.value,
      signature_data: { signature_id: 'signed-123', entity_id: 'doc-entity-123' },
    };

    await nextTick();

    expect(mockEsignRepository.clearSetDocumentData).toHaveBeenCalled();
  });
});
