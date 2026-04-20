import { computed } from 'vue';
import { useDialogs } from 'InvestCommon/domain/dialogs/store/useDialogs';
import { useAccreditationAlert } from 'InvestCommon/features/accreditation/logic/useAccreditationAlert';
import { useKycAlertViewModel } from 'InvestCommon/features/kyc/logic/useKycAlertViewModel';
import { useWalletAlert } from 'InvestCommon/features/wallet/logic/useWalletAlert';
import { useBreakpoints } from 'UiKit/composables/useBreakpoints';

export function useDashboardPageHeader() {
  const dialogsStore = useDialogs();
  const { isDesktop } = useBreakpoints();

  const {
    alertModel: kycAlertModel,
    isDataLoading: isKycDataLoading,
    onPrimaryAction: onKycBannerClick,
    onDescriptionAction: onKycBannerDescriptionAction,
  } = useKycAlertViewModel();

  const {
    alertModel: accreditationAlertModel,
    isDataLoading: isAccreditationDataLoading,
    onPrimaryAction: onAccreditationBannerClick,
    onDescriptionAction: onAccreditationBannerDescriptionAction,
  } = useAccreditationAlert();

  const {
    alertModel: walletAlertModel,
    isDataLoading: isWalletAlertLoading,
    onAlertButtonClick: onWalletBannerClick,
    onDescriptionAction: onWalletBannerDescriptionAction,
  } = useWalletAlert();

  const showPerformanceCards = computed(() => (
    isDesktop.value
    && !isKycDataLoading.value
    && !isAccreditationDataLoading.value
    && !kycAlertModel.value.show
    && !accreditationAlertModel.value.show
    && !walletAlertModel.value.show
  ));

  const onInfoCtaClick = () => dialogsStore.openContactUsDialog('dashboard profile details');

  return {
    onInfoCtaClick,
    onKycBannerClick,
    onKycBannerDescriptionAction,
    onAccreditationBannerClick,
    onAccreditationBannerDescriptionAction,
    onWalletBannerClick,
    onWalletBannerDescriptionAction,
    showPerformanceCards,
    kycAlertModel,
    isKycDataLoading,
    accreditationAlertModel,
    isAccreditationDataLoading,
    walletAlertModel,
    isWalletAlertLoading,
  };
}
