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

import { cookiesOptions } from 'InvestCommon/domain/config/cookies';

function clearAllCookies() {
  const cookies = useCookies();
  Object.keys(cookies.getAll()).forEach((key) => {
    cookies.remove(key, cookiesOptions());
  });
}

export const resetAllData = () => {
  clearAllCookies();
  useSessionStore().resetAll();
  useRepositoryAuth().resetAll();
  useRepositoryAccreditation().resetAll();
  useRepositoryNotifications().resetAll();
  useRepositoryProfiles().resetAll();
  useRepositoryKyc().resetAll();
  useRepositoryWallet().resetAll();
  useRepositoryFiler().resetAll();
  useRepositoryInvestment().resetAll();
  useRepositorySettings().resetAll();
  useRepositoryOffer().resetAll();
  useRepositoryEvm().resetAll();
  useRepositoryDistributions().resetAll();
  useRepositoryEsign().resetAll();
};
