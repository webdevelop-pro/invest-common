
import { useUserSession } from 'InvestCommon/store/useUserSession';
import { useCookies } from '@vueuse/integrations/useCookies';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useFundingStore } from 'InvestCommon/store/useFunding';
import { useProfileWalletTransactionStore } from 'InvestCommon/store/useProfileWallet/useProfileWalletTransaction';
import { useProfileWalletStore } from 'InvestCommon/store/useProfileWallet/useProfileWallet';
import { useProfileEvmWalletTransactionStore } from 'InvestCommon/store/useProfileEvmWallet/useProfileEvmWalletTransaction';
import { useProfileEvmWalletStore } from 'InvestCommon/store/useProfileEvmWallet/useProfileEvmWallet';
import { useUserProfilesStore } from 'InvestCommon/store/useUserProfiles';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { usePlaidStore } from 'InvestCommon/store/usePlaid';
import { useInvestmentsStore } from 'InvestCommon/store/useInvestments';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import { useFilerStore } from 'InvestCommon/store/useFiler';

function clearAllCookies() {
  const cookies = useCookies();
    Object.keys(cookies.getAll()).forEach((key) => cookies.remove(key));
  }

export const resetAllData = () => {
    useFundingStore().resetAll();
    useProfileWalletTransactionStore().resetAll();
    useProfileWalletStore().resetAll();
    useProfileEvmWalletTransactionStore().resetAll();
    useProfileEvmWalletStore().resetAll();
    useUserProfilesStore().resetAll();
    useUsersStore().resetAll();
    usePlaidStore().resetAll();
    useInvestmentsStore().resetAll();
    useAccreditationStore().resetAll();
    useAuthStore().resetAll();
    useNotificationsStore().resetAll();
    useFilerStore().resetAll();
    clearAllCookies();
    useUserSession().resetAll();
    useRepositoryAuth().resetAll();
}