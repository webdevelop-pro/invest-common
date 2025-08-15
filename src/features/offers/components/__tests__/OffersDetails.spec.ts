import { render, screen } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach, expect, describe, it, vi,
} from 'vitest';
// import { offerData } from '@/tests/__mocks__';
import OffersDetails from '../OffersDetails.vue';

vi.mock('vue-router', () => ({
  useRoute: vi.fn().mockReturnValue({ pushTo: vi.fn(), params: { profileId: '1' } }),
  useRouter: () => ({
    push: vi.fn(),
    currentRoute: { value: 'myCurrentRoute' },
  }),
}));

describe.skip('OffersDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  it('should shows offer data', () => {
    const options = {
      props: {
        // offer: offerData.data[0],
      },
    };

    render(OffersDetails, options);

    expect(screen.getByRole('heading', { name: options.props.offer.name, level: 1 })).toBeDefined();
    expect(screen.getByTestId('offer-image')).toHaveProperty('src', options.props.offer.image?.meta_data.big);
    expect(screen.getByText('$4,809.45')).toBeDefined();
    expect(screen.getByText('$3.21')).toBeDefined();
    expect(screen.getByText('$30,000,000')).toBeDefined();
  });
});
