import {
  computed, nextTick, watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useHubspotForm } from 'InvestCommon/composable/useHubspotForm';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { IInvestmentFormatted } from 'InvestCommon/data/investment/investment.types';
import { useRepositoryInvestment } from 'InvestCommon/data/investment/investment.repository';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { scrollToError } from 'UiKit/helpers/validation/general';
import {
  ROUTE_DASHBOARD_PORTFOLIO,
} from 'InvestCommon/helpers/enums/routes';

type FormModel = {
  cancelation_reason: string;
}

export const usePortfolioCancelInvestment = (
  investment: IInvestmentFormatted,
  open: Ref<boolean>,
  emit: (event: 'close') => void,
) => {
  const router = useRouter();
  const investmentRepository = useRepositoryInvestment();
  const { cancelInvestState, setCancelOptionsState } = storeToRefs(investmentRepository);
  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const userSessionStore = useSessionStore();
  const { userSessionTraits } = storeToRefs(userSessionStore);

  const errorData = computed(() => setCancelOptionsState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => setCancelOptionsState.value.data);

  const {
    model,
    validation,
    isValid,
    onValidate,
  } = useFormValidation<FormModel>(
    schemaBackend,
    undefined,
    {},
  );

  const { submitFormToHubspot } = useHubspotForm('0b39c12f-9416-42f6-ab71-9f13e6423859');

  const isBtnDisabled = computed(() => (!isValid.value || cancelInvestState.value.loading));

  const cancelInvestHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VDialogPortfolioCancelInvestment'));
      return;
    }

    if (investment?.id) {
      await investmentRepository.cancelInvest(String(investment?.id), model.cancelation_reason);
    }

    if (!cancelInvestState.value.error) {
      submitFormToHubspot({
        email: userSessionTraits.value?.email,
        cancellation_reason: model.cancelation_reason,
        cancellation_offer_name: investment?.offer?.name,
        cancellation_offer_id: investment?.id,
      });
      emit('close');
      router.push({
        name: ROUTE_DASHBOARD_PORTFOLIO,
        params: { profileId: selectedUserProfileId.value },
      });
    }
  };

  const onBackClick = () => {
    emit('close');
  };

  watch(() => open.value, () => {
    if (open.value && !schemaBackend.value) {
      investmentRepository.setCancelOptions(String(investment?.id));
    }
  }, { deep: true });

  return {
    model,
    validation,
    isValid,
    errorData,
    schemaBackend,
    isBtnDisabled,
    cancelInvestState,
    cancelInvestHandler,
    onBackClick,
  };
}; 