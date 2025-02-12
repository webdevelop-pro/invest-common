export const confirmedOffer = {
  data: [{
    id: 43,
    offer_id: 3,
    offer: {
      id: 3,
      name: 'Levels',
      slug: 'levels',
      title: 'Biowearables that improve your metabolic health',
      price_per_share: 49,
      min_investment: 2000,
      image: {
        bucket_path: '/filer/',
        filename: '9d9fc4237d3440826ccf54b6f135006380c9d2f6.jpg',
        id: 2197,
        meta_data: {
          big: 'https://webdevelop-us-media-thumbs.storage.googleapis.com/filer/9d9fc4237d3440826ccf54b6f135006380c9d2f6_big.webp',
          small: 'https://webdevelop-us-media-thumbs.storage.googleapis.com/filer/9d9fc4237d3440826ccf54b6f135006380c9d2f6_small.webp',
          medium: 'https://webdevelop-us-media-thumbs.storage.googleapis.com/filer/9d9fc4237d3440826ccf54b6f135006380c9d2f6_medium.webp',
          size: 19600000,
        },
        name: 'Arrival 2016 1080p BluRay x264 DTS-JYK.mkv.jpg',
        updated_at: '2023-12-01T15:21:42.046036+00:00',
        url: 'https://webdevelop-us-media.storage.googleapis.com//filer/9d9fc4237d3440826ccf54b6f135006380c9d2f6.jpg',
      },
      total_shares: 100000,
      valuation: 4999999,
      subscribed_shares: 0,
      confirmed_shares: 0,
      status: 'published',
      approved_at: '0001-01-01T00:00:00',
      website: 'https://www.levelshealth.com/',
      state: 'NY',
      city: 'New York',
      security_type: 'equity',
      close_at: '2024-11-15T17:34:47+00:00',
      seo_title: '',
      seo_description: '',
    },
    price_per_share: 49,
    number_of_shares: 4400,
    amount: 215600,
    step: 'signature',
    status: 'new',
    created_at: '2023-03-14T15:05:02.867582+00:00',
    funding_type: 'wire',
    funding_status: 'none',
    signature_data: {
      provider: '',
      signature_id: '',
      created_at: '',
    },
  }],
  meta: {
    total_investments: 215600,
    total_investments_12_months: 215600,
    total_distributions: 0,
    avarange_annual: 0,
  },
};

export const mockCombinedInvestAndOfferData = {
  id: 256,
  offer: {
    id: 27,
    name: 'Tiny step farm',
    legal_name: 'llc tiny step',
    slug: 'tiny-step-farm',
    title: 'title for offer',
    security_type: 'equity',
    price_per_share: 1,
    min_investment: 2,
    image: {
      id: null,
      url: null,
      updated_at: null,
      name: null,
      bucket_path: null,
      filename: null,
      meta_data: null,
    },
    total_shares: 5000,
    valuation: 50000,
    subscribed_shares: 5,
    confirmed_shares: 17,
    status: 'published',
    approved_at: '0001-01-01 00:00:00',
    website: 'www.webdevelop.pro',
    state: 'CA',
    city: 'Sacramento',
    close_at: '2025-03-14T07:13:48+00:00',
    seo_title: '',
    seo_description: '',
    description:
      '- Users have the option to create SDIRA and Solo401k profiles without limitations on quantity.\r\n- Shared Account ID/Party ID/Link ID features between individual, Solo401k, and SDIRA profiles facilitate accreditation sharing across profiles.\r\n- The creation of SDIRA/Solo401k profiles can trigger the creation of corresponding North Capital entities if not previously established through individual profile activities.',
    highlights:
      '- Users have the option to create SDIRA and Solo401k profiles without limitations on quantity.\r\n- Shared Account ID/Party ID/Link ID features between individual, Solo401k, and SDIRA profiles facilitate accreditation sharing across profiles.\r\n- The creation of SDIRA/Solo401k profiles can trigger the creation of corresponding North Capital entities if not previously established through individual profile activities.',
    data: {},
    amount_raised: 5,
    documents: [],
  },
  profile_id: 125,
  user_id: 125,
  price_per_share: 1,
  number_of_shares: 2,
  amount: 2,
  step: 'review',
  status: 'confirmed',
  created_at: '2024-04-24 17:44:42.503405+00:00',
  submited_at: '2024-04-24 17:44:42.500547+00:00',
  funding_type: 'wire',
  funding_status: 'none',
  signature_data: {
    provider: 'hellosign',
    entity_id: '517547f2faa1e9e0130aa63c55e9f1df2a85f8f5',
    created_at: '2024-04-24T17:46:32.661859',
    ip_address: '127.0.0.1:47156',
    signature_id: '0b051a008ada02ef08fdd4b697d4d5b5',
    user_browser:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
    signed_by_investor: true,
  },
  escrow_data: {
    pr_name: '',
    transaction_id: '1851825',
    pr_approval_date: '',
    pr_approval_status: 'Pending',
  },
  payment_data: { account_type: 'checking', account_holder_name: 'sdfdsf' },
  payment_type: 'north_capital',
  escrow_type: 'north_capital',
};
