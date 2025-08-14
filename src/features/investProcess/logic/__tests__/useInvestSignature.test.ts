import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHelloSign } from 'InvestCommon/composable/useHelloSign';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import { ROUTE_INVEST_FUNDING } from 'InvestCommon/helpers/enums/routes';
import { useInvestSignature } from '../useInvestSignature';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
  useRoute: vi.fn(),
}));

vi.mock('InvestCommon/composable/useHelloSign', () => ({
  useHelloSign: vi.fn(),
}));

vi.mock('InvestCommon/composable/useHubspotForm', () => ({
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

describe('useInvestSignature', () => {
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
      data: 'https://example.com/document',
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

  describe('initialization', () => {
    it('should initialize correctly and hide global loader', () => {
      const composable = useInvestSignature();
      
      expect(mockGlobalLoader.hide).toHaveBeenCalled();
      expect(mockHelloSign.onSign).toHaveBeenCalled();
      expect(composable.slug.value).toBe('test-slug');
      expect(composable.id.value).toBe('test-id');
      expect(composable.profileId.value).toBe('test-profile-id');
    });
  });

  describe('computed properties', () => {
    it('should compute properties correctly', () => {
      const composable = useInvestSignature();
      
      expect(composable.signUrl.value).toBe('https://example.com/sign');
      expect(composable.isLoading.value).toBe(false);
      expect(composable.canContinue.value).toBe(false);

      mockInvestmentRepository.setSignatureState.value.loading = true;
      expect(composable.isLoading.value).toBe(true);

      composable.state.value.checkbox1 = true;
      composable.state.value.checkbox2 = true;
      expect(composable.canContinue.value).toBe(true);
    });
  });

  describe('handleSign', () => {
    it('should set signature successfully', async () => {
      const composable = useInvestSignature();
      const signatureData = { signatureId: 'new-signature-id' };

      await composable.handleSign(signatureData);

      expect(mockInvestmentRepository.setSignature).toHaveBeenCalledWith(
        'test-slug', 'test-id', 'test-profile-id', 'new-signature-id'
      );
      expect(composable.signId.value).toBe('new-signature-id');
    });

    it('should handle missing signatureId gracefully', async () => {
      const composable = useInvestSignature();
      const signatureData = { signatureId: null };

      await composable.handleSign(signatureData);

      expect(mockInvestmentRepository.setSignature).not.toHaveBeenCalled();
    });
  });

  describe('handleContinue', () => {
    it('should proceed when conditions are met', () => {
      const composable = useInvestSignature();
      
      composable.state.value.checkbox1 = true;
      composable.state.value.checkbox2 = true;
      composable.signId.value = 'test-signature-id';

      composable.handleContinue();

      expect(mockRouter.push).toHaveBeenCalledWith({ name: ROUTE_INVEST_FUNDING });
      expect(mockHubspotForm.submitFormToHubspot).toHaveBeenCalledWith({
        email: 'test@example.com',
        invest_checkbox_1: true,
        invest_checkbox_2: true,
        sign_id: 'test-signature-id',
      });
    });

    it('should not proceed when conditions are not met', () => {
      const composable = useInvestSignature();
      
      composable.handleContinue();

      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(mockHubspotForm.submitFormToHubspot).not.toHaveBeenCalled();
    });
  });

  describe('handleDocument', () => {
    it('should open existing document when signId exists', async () => {
      const composable = useInvestSignature();
      composable.signId.value = 'existing-signature-id';

      await composable.handleDocument();

      expect(mockEsignRepository.getDocument).toHaveBeenCalledWith('test-id');
    });

    it('should create new document when signId does not exist', async () => {
      const composable = useInvestSignature();
      composable.signId.value = null;

      await composable.handleDocument();

      expect(mockEsignRepository.setDocument).toHaveBeenCalledWith(
        'test-slug', 'test-id', 'test-profile-id'
      );
      expect(composable.state.value.isDialogDocumentOpen).toBe(true);
    });
  });

  describe('watchers and state sync', () => {
    it('should sync signId when repository data changes', async () => {
      const composable = useInvestSignature();
      
      mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data.signature_id = 'updated-id';
      
      await nextTick();
      expect(composable.signId.value).toBe('updated-id');
    });

    it('should handle missing signature data gracefully', () => {
      mockInvestmentRepository.getInvestUnconfirmedOne.value.signature_data = null;
      
      const composable = useInvestSignature();
      expect(composable.signId.value).toBeUndefined();
    });
  });
});
