import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useCookies } from '@vueuse/integrations/useCookies';

import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useRepositoryKyc } from 'InvestCommon/data/kyc/kyc.repository';
import { useRepositoryAccreditation } from 'InvestCommon/data/accreditation/accreditation.repository';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import { useRepositoryWallet } from 'InvestCommon/data/wallet/wallet.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useRepositoryDistributions } from 'InvestCommon/data/distributions/distributions.repository';
import { useRepositoryEsign } from 'InvestCommon/data/esign/esign.repository';
import { useRepositoryEarn } from 'InvestCommon/data/earn/earn.repository';
import { useWalletAuth } from 'InvestCommon/features/wallet/auth/store/useWalletAuth';

import { cookiesOptions } from 'InvestCommon/domain/config/cookies';
import { clearPrivatePwaData } from 'InvestCommon/domain/pwa/pwaOfflineStore';

function clearAllCookies() {
  const cookies = useCookies();
  Object.keys(cookies.getAll()).forEach((key) => {
    // Pass a date in the past to expire the cookie
    cookies.remove(key, cookiesOptions(new Date(0)));
  });
}

export const resetAllProfileData = (options: { clearPrivatePwa?: boolean } = {}) => {
  const { clearPrivatePwa = true } = options;
  // Reset profile-specific data (NOT the profiles list)
  useRepositoryProfiles().resetProfileData();
  
  // Reset all other profile-dependent repositories
  useRepositoryAccreditation().resetAll();
  useRepositoryKyc().resetAll();
  useRepositoryWallet().resetAll();
  useRepositoryFiler().resetAll();
  useRepositoryInvestment().resetAll();
  useRepositorySettings().resetAll();
  useRepositoryEvm().resetAll();
  useRepositoryDistributions().resetAll();
  useRepositoryEsign().resetAll();
  // Note: useRepositoryEarn is NOT reset here to preserve positions data across page navigation
  // It will only be reset on logout via resetAllData()
  if (clearPrivatePwa) {
    void clearPrivatePwaData();
  }
};

export const resetAllData = async () => {
  clearAllCookies();
  useSessionStore().resetAll();
  useRepositoryAuth().resetAll();
  await useWalletAuth().resetAll();
  resetAllProfileData({ clearPrivatePwa: false });
  useRepositoryOffer().resetAll();
  useRepositoryNotifications().resetAll();
  // Reset earn data on full logout/reset
  useRepositoryEarn().resetAll();
  await clearPrivatePwaData();
};
