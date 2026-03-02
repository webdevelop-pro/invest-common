import { describe, it, expect, vi, beforeEach } from 'vitest';

const resetAllMock = vi.fn();
const makeRepoMock = () => ({ resetAll: vi.fn(), resetProfileData: vi.fn() });

const authRepo = makeRepoMock();
const kycRepo = makeRepoMock();
const accreditationRepo = makeRepoMock();
const notificationsRepo = makeRepoMock();
const walletRepo = makeRepoMock();
const profilesRepo = makeRepoMock();
const filerRepo = makeRepoMock();
const investmentRepo = makeRepoMock();
const settingsRepo = makeRepoMock();
const offerRepo = makeRepoMock();
const evmRepo = makeRepoMock();
const distributionsRepo = makeRepoMock();
const esignRepo = makeRepoMock();
const earnRepo = makeRepoMock();

const removeCookieMock = vi.fn();

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => ({
    getAll: () => ({ a: '1', b: '2' }),
    remove: removeCookieMock,
  }),
}));

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({ resetAll: resetAllMock }),
}));

vi.mock('InvestCommon/data/auth/auth.repository', () => ({
  useRepositoryAuth: () => authRepo,
}));
vi.mock('InvestCommon/data/kyc/kyc.repository', () => ({
  useRepositoryKyc: () => kycRepo,
}));
vi.mock('InvestCommon/data/accreditation/accreditation.repository', () => ({
  useRepositoryAccreditation: () => accreditationRepo,
}));
vi.mock('InvestCommon/data/notifications/notifications.repository', () => ({
  useRepositoryNotifications: () => notificationsRepo,
}));
vi.mock('InvestCommon/data/wallet/wallet.repository', () => ({
  useRepositoryWallet: () => walletRepo,
}));
vi.mock('InvestCommon/data/profiles/profiles.repository', () => ({
  useRepositoryProfiles: () => profilesRepo,
}));
vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: () => filerRepo,
}));
vi.mock('InvestCommon/data/investment/investment.repository', () => ({
  useRepositoryInvestment: () => investmentRepo,
}));
vi.mock('InvestCommon/data/settings/settings.repository', () => ({
  useRepositorySettings: () => settingsRepo,
}));
vi.mock('InvestCommon/data/offer/offer.repository', () => ({
  useRepositoryOffer: () => offerRepo,
}));
vi.mock('InvestCommon/data/evm/evm.repository', () => ({
  useRepositoryEvm: () => evmRepo,
}));
vi.mock('InvestCommon/data/distributions/distributions.repository', () => ({
  useRepositoryDistributions: () => distributionsRepo,
}));
vi.mock('InvestCommon/data/esign/esign.repository', () => ({
  useRepositoryEsign: () => esignRepo,
}));
vi.mock('InvestCommon/data/earn/earn.repository', () => ({
  useRepositoryEarn: () => earnRepo,
}));

import { resetAllData, resetAllProfileData } from '../resetAllData';

describe('resetAllData & resetAllProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resetAllProfileData resets only profile-dependent repositories', () => {
    resetAllProfileData();

    expect(profilesRepo.resetProfileData).toHaveBeenCalledTimes(1);
    expect(accreditationRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(kycRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(walletRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(filerRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(investmentRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(settingsRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(evmRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(distributionsRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(esignRepo.resetAll).toHaveBeenCalledTimes(1);

    // Earn is intentionally not reset here
    expect(earnRepo.resetAll).not.toHaveBeenCalled();
  });

  it('resetAllData clears cookies, session, and all repositories including earn', () => {
    resetAllData();

    // Cookies cleared for each key
    expect(removeCookieMock).toHaveBeenCalledTimes(2);

    // Session
    expect(resetAllMock).toHaveBeenCalledTimes(1);

    // Auth + profile-dependent repos
    expect(authRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(profilesRepo.resetProfileData).toHaveBeenCalledTimes(1);
    expect(accreditationRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(kycRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(walletRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(filerRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(investmentRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(settingsRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(evmRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(distributionsRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(esignRepo.resetAll).toHaveBeenCalledTimes(1);

    // Offer & notifications
    expect(offerRepo.resetAll).toHaveBeenCalledTimes(1);
    expect(notificationsRepo.resetAll).toHaveBeenCalledTimes(1);

    // Earn is reset only here
    expect(earnRepo.resetAll).toHaveBeenCalledTimes(1);
  });
});

