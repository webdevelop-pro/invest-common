import { render, screen } from '@testing-library/vue';
import {
  beforeEach, expect, describe, it, vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import OffersDetailsContent from '../OffersDetailsContent.vue';

vi.mock('vue-router', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    currentRoute: {
      value: {
        meta: {
          auth: true,
        },
      },
    },
  }),
  useRoute: () => ({
    params: { profileId: '1' },
  }),
}));

describe.skip('OffersDetailsContent', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  it('should shows content data', () => {
    const options = {
      props: {
        description: 'test description',
        offerName: 'abc',
        offer: {
          id: 1,
          description: 'test description',
        },
        documents: [
          {
            url: 'http://',
            name: 'test',
            filename: 'test',
          },
        ],
      },
    };

    render(OffersDetailsContent, options);

    expect(screen.getByText('test description')).toBeDefined();
  });
});
