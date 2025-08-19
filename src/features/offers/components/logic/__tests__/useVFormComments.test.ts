import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useVFormComments } from '../useVFormComments';
import { navigateWithQueryParams } from 'UiKit/helpers/general';

vi.mock('vitepress', () => ({
  useRoute: vi.fn(() => ({ path: '/offers/test' })),
}));

vi.mock('UiKit/helpers/general', () => ({
  navigateWithQueryParams: vi.fn(),
}));

vi.mock('InvestCommon/global/links', () => ({
  urlSignin: 'https://static.example.com/signin',
}));

const mockGetOptions = vi.fn(() => ([
  { value: 'none', name: 'None' },
  { value: 'general', name: 'General' },
]));

vi.mock('UiKit/helpers/model', () => ({
  getOptions: vi.fn((...args) => mockGetOptions(...args)),
}));

const mockOfferRepo = {
  setOfferComment: vi.fn(async () => {}),
  getOfferComments: vi.fn(async () => {}),
  setOfferCommentState: ref({ error: null, data: { id: 1 } }),
  setOfferCommentOptionsState: ref({ data: { properties: {} } }),
};

vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: vi.fn(() => mockOfferRepo),
}));

vi.mock('InvestCommon/composable/useFormValidation', () => ({
  useFormValidation: vi.fn((_a: any, _b: any, defaults: any) => ({
    model: ref({ comment: '', offer_id: defaults.offer_id, related: defaults.related }),
    validation: ref({}),
    isValid: ref(true),
    onValidate: vi.fn(),
    schemaObject: ref({}),
  })),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: vi.fn(() => ({ userLoggedIn: ref(true) })),
}));

describe('useVFormComments', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    (mockOfferRepo.setOfferCommentState as any).value = { error: null, data: { id: 1 } };
  });

  it('sendQuestion validates, posts and clears comment on success', async () => {
    const c = useVFormComments(77);
    c.model.comment = 'Hello';
    await c.sendQuestion();
    expect(mockOfferRepo.setOfferComment).toHaveBeenCalled();
    expect(mockOfferRepo.getOfferComments).toHaveBeenCalledWith(77);
    expect(c.model.comment).toBe('');
  });

  it('signInHandler navigates to signin with redirect', () => {
    const { signInHandler } = useVFormComments(5);
    Object.defineProperty(window, 'location', { value: { search: '?a=1', hash: '#tab' } });
    signInHandler();
    expect(navigateWithQueryParams).toHaveBeenCalledWith('https://static.example.com/signin', { redirect: '/offers/test?a=1#tab' });
  });

  it('disclosureCheckbox watcher resets related to none when unchecked', async () => {
    const c = useVFormComments(5);
    c.model.related = 'general';
    c.disclosureCheckbox.value = true;
    await nextTick();
    c.disclosureCheckbox.value = false;
    await nextTick();
    expect(c.model.related).toBe('none');
  });
});


