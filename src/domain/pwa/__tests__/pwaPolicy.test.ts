import {
  describe,
  expect,
  it,
} from 'vitest';
import { matchOfflineDomainPolicy } from '../pwaPolicy';

const TEST_ENV = {
  FRONTEND_URL: 'https://frontend.test',
  OFFER_URL: 'https://offer.test',
  USER_URL: 'https://user.test',
  INVESTMENT_URL: 'https://investment.test',
  WALLET_URL: 'https://wallet.test',
  EVM_URL: 'https://evm.test',
  FILER_URL: 'https://filer.test',
  DISTRIBUTIONS_URL: 'https://distributions.test',
  ACCREDITATION_URL: 'https://accreditation.test',
  KRATOS_URL: 'https://kratos.test',
} as const;

describe('matchOfflineDomainPolicy', () => {
  it('matches any GET under safe first-party business domains', () => {
    expect(matchOfflineDomainPolicy('https://offer.test/public/offer/featured', 'GET', TEST_ENV)?.key)
      .toBe('offer-api');
    expect(matchOfflineDomainPolicy('https://user.test/auth/preferences', 'GET', TEST_ENV)?.key)
      .toBe('user-api');
    expect(matchOfflineDomainPolicy('https://investment.test/auth/invest/custom-report/42', 'GET', TEST_ENV)?.key)
      .toBe('investment-api');
    expect(matchOfflineDomainPolicy('https://wallet.test/auth/balance/history', 'GET', TEST_ENV)?.key)
      .toBe('wallet-api');
    expect(matchOfflineDomainPolicy('https://evm.test/auth/assets/positions', 'GET', TEST_ENV)?.key)
      .toBe('evm-api');
    expect(matchOfflineDomainPolicy('https://distributions.test/auth/123/export', 'GET', TEST_ENV)?.key)
      .toBe('distributions-api');
    expect(matchOfflineDomainPolicy('https://accreditation.test/auth/review/123', 'GET', TEST_ENV)?.key)
      .toBe('accreditation-api');
  });

  it('keeps filer caching limited to audited public and private file paths', () => {
    expect(matchOfflineDomainPolicy('https://filer.test/public/objects/offer/12', 'GET', TEST_ENV)?.key)
      .toBe('filer-public-api');
    expect(matchOfflineDomainPolicy('https://filer.test/public/files/12?size=big', 'GET', TEST_ENV)?.key)
      .toBe('filer-public-api');
    expect(matchOfflineDomainPolicy('https://filer.test/private/files/12', 'GET', TEST_ENV))
      .toBeNull();
  });

  it('does not cache excluded or non-GET requests', () => {
    expect(matchOfflineDomainPolicy('https://kratos.test/sessions/whoami', 'GET', TEST_ENV))
      .toBeNull();
    expect(matchOfflineDomainPolicy('https://notifications.test/notification', 'GET', TEST_ENV))
      .toBeNull();
    expect(matchOfflineDomainPolicy('https://offer.test/public/offer', 'POST', TEST_ENV))
      .toBeNull();
  });
});
