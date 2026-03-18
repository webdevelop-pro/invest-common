import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { IOffer } from '../offer.types';

const apiGetMock = vi.hoisted(() => vi.fn());

vi.mock('InvestCommon/config/env', () => ({
  default: {
    OFFER_URL: 'https://offer.test',
  },
}));

vi.mock('InvestCommon/data/service/apiClient', () => ({
  ApiClient: class {
    get = apiGetMock;
  },
}));

import { useRepositoryOffer } from '../offer.repository';

const createOffer = (overrides: Partial<IOffer> = {}): IOffer => ({
  id: 7,
  name: 'Springfield Bond',
  legal_name: 'Springfield Bond LLC',
  slug: 'springfield-bond',
  title: 'Springfield Bond',
  security_type: 'debt',
  price_per_share: 100,
  min_investment: 10,
  image_link_id: 20,
  total_shares: 1000,
  valuation: 500000,
  subscribed_shares: 250,
  confirmed_shares: 200,
  status: 'published',
  approved_at: '2026-03-01T00:00:00.000Z',
  website: 'https://springfield.example',
  state: 'IL',
  city: 'Springfield',
  security_info: {
    voting_rights: '',
    liquidation_preference: '',
    dividend_type: '',
    dividend_rate: '',
    dividend_payment_frequency: '',
    cn_valuation_cap: '',
    cn_discount_rate: '',
    cn_interest_rate: '',
    cn_maturity_date: '',
    interest_rate_apy: '',
    debt_payment_schedule: 'interest_only_monthly',
    debt_maturity_date: '2027-03-01T00:00:00.000Z',
    debt_interest_rate: '8',
    debt_term_length: '12',
    debt_term_unit: 'months',
    pre_money_valuation: 0,
  },
  close_at: '2026-12-31T00:00:00.000Z',
  seo_title: 'Springfield Bond Offer',
  seo_description: 'List card description',
  description: '',
  highlights: '',
  risk_disclosures: '',
  additional_details: '',
  data: {
    wire_to: '',
    swift_id: '',
    custodian: '',
    account_number: '',
    routing_number: '',
    apy: '',
    distribution_frequency: '',
    investment_strategy: '',
    estimated_hold_period: '',
    video: '',
  },
  linkedin: '',
  facebook: '',
  twitter: '',
  github: '',
  instagram: '',
  telegram: '',
  mastodon: '',
  reg_type: 'Reg D 506(c)',
  amount_raised: 25000,
  target_raise: 100000,
  ...overrides,
});

describe('useRepositoryOffer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    apiGetMock.mockReset();
  });

  it('replaces cached list data when detail fields arrive for the same offer id', async () => {
    const listOffer = createOffer();
    const detailOffer = createOffer({
      description: 'Full description from the detail endpoint',
      highlights: 'Detail highlights',
      risk_disclosures: 'Detail risk disclosures',
    });

    apiGetMock
      .mockResolvedValueOnce({
        data: {
          count: 1,
          data: [listOffer],
        },
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: detailOffer,
        headers: new Headers(),
      });

    const store = useRepositoryOffer();

    await store.getOffers();
    await store.getOfferOne(detailOffer.slug);

    expect(store.getOfferOneState.data?.description).toBe(
      'Full description from the detail endpoint',
    );
    expect(store.getOfferOneState.data?.highlights).toBe('Detail highlights');
    expect(store.getOfferOneState.data?.risk_disclosures).toBe('Detail risk disclosures');
  });
});
