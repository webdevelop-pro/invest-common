import { RouteLocationNormalized } from 'vue-router';
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { usePageSeo } from 'InvestCommon/shared/composables/usePageSeo';
import { reportError } from 'InvestCommon/domain/error/errorReporting';

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

    try {
      if (!getInvestmentsState.value.data?.data?.length) {
        await investmentRepository.getInvestments(to?.params?.profileId as string);
      }

      const investmentID = computed(() => to?.params?.id);
      const investmentExists = getInvestmentsState.value.data?.data?.some(
        (investment: any) => String(investment.id) === investmentID.value,
      );

      if (!investmentExists) {
        return '/error/404';
      }

      if (investmentID.value && (String(getInvestOneState.value.data?.id) !== investmentID.value)) {
        await investmentRepository.getInvestOne(String(investmentID.value));
      }
    } catch (error) {
      reportError(error, 'Failed to load investment');
      return '/error/404';
    }
  };
}; 