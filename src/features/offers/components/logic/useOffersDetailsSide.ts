import { computed, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useClipboard } from '@vueuse/core';
import type { IOfferFormatted } from 'InvestCommon/data/offer/offer.types';
import { useRepositoryFiler } from 'InvestCommon/data/filer/filer.repository';
import { FilerFormatter } from 'InvestCommon/data/filer/filer.formatter';

export interface ReadOnlyInfoItem {
  title?: string;
  text?: string;
  value?: string;
  tooltip?: string;
}


export function useOffersDetailsSide(offerRef: Ref<IOfferFormatted | undefined>) {
  const filerRepository = useRepositoryFiler();
  const { getFilesState, getPublicFilesState } = storeToRefs(filerRepository);

  const filesFormatted = computed(() => (
    FilerFormatter.getFormattedInvestmentDocuments(getFilesState.value.data, getPublicFilesState.value.data)));

  const { copy, copied } = useClipboard({ legacy: true });

  const readOnlyInfo = computed<ReadOnlyInfoItem[]>(() => ([
    {
      title: 'Share Price:',
      text: offerRef.value?.pricePerShareFormatted,
    },
    {
      title: offerRef.value?.valuationLabel,
      text: offerRef.value?.valuationFormatted,
    },
    {
      title: 'Security Type:',
      text: offerRef.value?.securityTypeFormatted,
      tooltip: offerRef.value?.securityTypeTooltip,
    },
    {
      title: 'Interest Rate:',
      text: offerRef.value?.data?.apy,
    },
    {
      title: 'Distribution Frequency:',
      text: offerRef.value?.data?.distribution_frequency,
    },
    {
      title: 'Investment Strategy:',
      text: offerRef.value?.data?.investment_strategy,
    },
    {
      title: 'Estimated Hold Period:',
      text: offerRef.value?.data?.estimated_hold_period,
    },
    {
      title: 'Close Date:',
      text: offerRef.value?.closeAtFormatted,
      tooltip: 'Closing offer date may vary depending on factors such as property type, financing conditions, buyer readiness, or legal requirements.',
    },
    {
      title: 'Voting Rights:',
      text: offerRef.value?.votingRightsFormatted,
    },
    {
      title: 'Liquidation Preference:',
      text: offerRef.value?.liquidationPreferenceFormatted,
    },
    {
      title: 'Dividend Type:',
      text: offerRef.value?.dividendTypeFormatted,
    },
    {
      title: 'Valuation Cap:',
      text: offerRef.value?.valuationCapFormatted,
    },
    {
      title: 'Discount Rate:',
      text: offerRef.value?.discountRateFormatted,
    },
    {
      title: 'Interest Rate:',
      text: offerRef.value?.interestRateFormatted,
    },
    {
      title: 'Maturity Date:',
      text: offerRef.value?.maturityDateFormatted,
    },
    {
      title: 'Interest Rate (APY):',
      text: offerRef.value?.interestRateApyFormatted,
    },
    {
      title: 'Payment Schedule:',
      text: offerRef.value?.paymentScheduleFormatted,
      tooltip: 'Payment schedule refers to how often interest payments are made to investors (e.g., monthly, quarterly, annually, or at maturity',
    },
    {
      title: 'Term Length:',
      text: offerRef.value?.termLengthFormatted,
    },
  ]));

  const investmentDocUrl = computed(() => (
    filesFormatted.value.find((doc) => doc.typeFormatted.toLowerCase().includes('investment-agreements'))?.url
  ));

  const onShareClick = () => {
    copy(window?.location?.href);
  };

  return {
    filesFormatted,
    readOnlyInfo,
    investmentDocUrl,
    onShareClick,
    copied,
  };
}


