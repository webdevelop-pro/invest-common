import { RouteLocationNormalized } from 'vue-router';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import type { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { usePageSeo } from 'InvestCommon/shared/composables/usePageSeo';
import { reportError } from 'InvestCommon/domain/error/errorReporting';
import { isOfflineReadFailure } from 'InvestCommon/domain/pwa/offlineRead';

const { setMetaData } = usePageSeo();

export const createInvestmentRouteGuard = (seoTitle: string, seoDescription: string) => {
  return async (to: RouteLocationNormalized) => {
    setMetaData({
      seo_title: seoTitle,
      seo_description: seoDescription,
      canonical: to.fullPath,
    });

    const investmentRepository = useRepositoryInvestment();
    const { getInvestOneState, getInvestmentsState } = storeToRefs(investmentRepository);
    const investmentID = computed(() => to?.params?.id);

    try {
      if (!getInvestmentsState.value.data?.data?.length) {
        await investmentRepository.getInvestments(to?.params?.profileId as string);
      }
      const investmentExists = getInvestmentsState.value.data?.data?.some(
        (investment: IInvestmentFormatted) => String(investment.id) === investmentID.value,
      );

      if (!investmentExists) {
        if (investmentID.value) {
          try {
            await investmentRepository.getInvestOne(String(investmentID.value));
            return;
          } catch (error) {
            if (isOfflineReadFailure(error)) {
              return;
            }
          }
        }
        return '/error/404';
      }

      if (investmentID.value && (String(getInvestOneState.value.data?.id) !== investmentID.value)) {
        try {
          await investmentRepository.getInvestOne(String(investmentID.value));
        } catch (error) {
          if (isOfflineReadFailure(error)) {
            return;
          }

          throw error;
        }
      }
    } catch (error) {
      if (isOfflineReadFailure(error)) {
        return;
      }

      reportError(error, 'Failed to load investment');
      return '/error/404';
    }
  };
}; 
