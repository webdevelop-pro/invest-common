import { render, screen } from '@testing-library/vue';
import OffersCard from '../OffersCard.vue';
import { offerData } from 'InvestCommon/tests/__mocks__';
import { createPinia, setActivePinia } from 'pinia';
import {
  beforeEach, expect, describe, it,
} from 'vitest';

describe('OffersCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  it('should shows offer data', () => {
    const options = {
      props: {
        offer: offerData.data[0],
      },
    };

    render(OffersCard, options);

    expect(screen.getByTestId('offer-title')).toBeDefined();
    expect(screen.getByRole('img')).toHaveProperty('src', options.props.offer.image.meta_data.medium);
    expect(screen.getByText('$30,000,000')).toBeDefined();
  });
});
