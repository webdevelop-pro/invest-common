import { RouteLocationNormalized } from 'vue-router';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import type { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { usePageSeo } from 'InvestCommon/shared/composables/usePageSeo';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { isBrowserOffline } from './authGuardOffline';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';

const { setMetaData } = usePageSeo();
const showOfflineUncachedInvestmentToast = () => {
  const { toast } = useToast();
  toast({
    title: 'Investment page unavailable offline',
    description: 'This page was not saved on this device. Reconnect to open it.',
    variant: 'error',
  });
};

export const createInvestmentRouteGuard = (seoTitle: string, seoDescription: string) => {
  return async (to: RouteLocationNormalized) => {
    setMetaData({
      seo_title: seoTitle,
      seo_description: seoDescription,
      canonical: to.fullPath,
    });

    const investmentRepository = useRepositoryInvestment();
    const { getInvestOneState, getInvestmentsState } = storeToRefs(investmentRepository);

    try {
      if (!getInvestmentsState.value.data?.data?.length) {
        await investmentRepository.getInvestments(to?.params?.profileId as string);
      }

      const investmentID = computed(() => to?.params?.id);
      const investmentExists = getInvestmentsState.value.data?.data?.some(
        (investment: IInvestmentFormatted) => String(investment.id) === investmentID.value,
      );

      if (!investmentExists) {
        if (isBrowserOffline()) {
          showOfflineUncachedInvestmentToast();
          return false;
        }
        return '/error/404';
      }

      if (investmentID.value && (String(getInvestOneState.value.data?.id) !== investmentID.value)) {
        try {
          await investmentRepository.getInvestOne(String(investmentID.value));
        } catch (error) {
          if (isBrowserOffline()) {
            showOfflineUncachedInvestmentToast();
            return false;
          }
          throw error;
        }
      }
    } catch (error) {
      if (isBrowserOffline()) {
        showOfflineUncachedInvestmentToast();
        return false;
      }
      reportError(error, 'Failed to load investment');
      return '/error/404';
    }
  };
};
