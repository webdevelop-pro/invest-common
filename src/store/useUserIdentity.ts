import { ref } from 'vue';
import { IProfileData } from 'InvestCommon/types/api/invest';
import {
  fetchSetUserIndividualProfile, fetchSetUserBackgroundInfo, fetchSetUserIndividualProfileOptions,
  fetchSetUserBackgroundInfoOptions, fetchGetUserIndividualProfile,
} from 'InvestCommon/services';
import { generalErrorHandling } from 'InvestCommon/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useCore } from 'InvestCommon/store';
import { IProfileIndividual, ISchema } from 'InvestCommon/types/api/user';


export const useUserIdentitysStore = defineStore('userIdentity', () => {
  const { person } = useCore();

  const isSetUserIdentityLoading = ref(false);
  const isSetUserIdentityError = ref(false);
  const setUserIdentityData = ref<IProfileData>();
  const setUserIdentityErrorData = ref();
  const setUserIdentity = async (data: IProfileData, update = true) => {
    isSetUserIdentityLoading.value = true;
    isSetUserIdentityError.value = false;
    setUserIdentityErrorData.value = undefined;
    const response = await fetchSetUserIndividualProfile(data).catch(async (error: Response) => {
      isSetUserIdentityError.value = true;
      setUserIdentityErrorData.value = JSON.parse(await error.text());
      void generalErrorHandling(error);
    });
    if (response) {
      setUserIdentityData.value = response;
      if (update) person.value.setUserData(setUserIdentityData.value);
    }
    isSetUserIdentityLoading.value = false;
  };

  const isGetUserIndividualProfileLoading = ref(false);
  const isGetUserIndividualProfileError = ref(false);
  const getUserIndividualProfileData = ref<IProfileIndividual>();
  const getUserIndividualProfile = async () => {
    isGetUserIndividualProfileLoading.value = true;
    isGetUserIndividualProfileError.value = false;
    const response = await fetchGetUserIndividualProfile().catch((error: Response) => {
      isGetUserIndividualProfileError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      getUserIndividualProfileData.value = response;
      person.value.setUserData({
        ...getUserIndividualProfileData.value.data,
        profile_id: getUserIndividualProfileData.value.id,
        profile_type: getUserIndividualProfileData.value.type,
        user_id: getUserIndividualProfileData.value.user_id,
        escrow_id: getUserIndividualProfileData.value.escrow_id,
        kyc_status: getUserIndividualProfileData.value.kyc_status,
        kyc_data: getUserIndividualProfileData.value.kyc_data,
        accreditation_status: getUserIndividualProfileData.value.accreditation_status,
        accreditation_data: getUserIndividualProfileData.value.accreditation_data,
        total_distributions: getUserIndividualProfileData.value.total_distributions,
        total_investments: getUserIndividualProfileData.value.total_investments,
        total_investments_12_months: getUserIndividualProfileData.value.total_investments_12_months,
        wallet_id: getUserIndividualProfileData.value.wallet?.id,
      });
    }
    isGetUserIndividualProfileLoading.value = false;
  };


  const isSetUserIdentityOptionsLoading = ref(false);
  const isSetUserIdentityOptionsError = ref(false);
  const setUserIdentityOptionsData = ref<ISchema>();
  const setUserIdentityOptions = async () => {
    isSetUserIdentityOptionsLoading.value = true;
    isSetUserIdentityOptionsError.value = false;
    const response = await fetchSetUserIndividualProfileOptions().catch((error: Response) => {
      isSetUserIdentityOptionsError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      // eslint-disable-next-line
      setUserIdentityOptionsData.value = response;
      if (setUserIdentityOptionsData.value.definitions?.RegCF) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        delete setUserIdentityOptionsData.value.definitions.RegCF?.required;
      }
    }
    isSetUserIdentityOptionsLoading.value = false;
  };


  const isSetUserBackgroundInfoLoading = ref(false);
  const isSetUserBackgroundInfoError = ref(false);
  const setUserBackgroundInfoData = ref<IProfileData>();
  const setUserBackgroundInfoErrorData = ref();
  const setUserBackgroundInfo = async (data: IProfileData) => {
    isSetUserBackgroundInfoLoading.value = true;
    isSetUserBackgroundInfoError.value = false;
    const response = await fetchSetUserBackgroundInfo(data).catch(async (error: Response) => {
      isSetUserBackgroundInfoError.value = true;
      setUserBackgroundInfoErrorData.value = JSON.parse(await error.text());
      void generalErrorHandling(error);
    });
    if (response) {
      setUserBackgroundInfoData.value = response;
      person.value.setUserData(setUserBackgroundInfoData.value);
    }
    isSetUserBackgroundInfoLoading.value = false;
  };

  const isSetUserBackgroundInfoOptionsLoading = ref(false);
  const isSetUserBackgroundInfoOptionsError = ref(false);
  const setUserBackgroundInfoOptionsData = ref();
  const setUserBackgroundInfoOptions = async () => {
    isSetUserBackgroundInfoOptionsLoading.value = true;
    isSetUserBackgroundInfoOptionsError.value = false;
    const response = await fetchSetUserBackgroundInfoOptions().catch((error: Response) => {
      isSetUserBackgroundInfoOptionsError.value = true;
      void generalErrorHandling(error);
    });
    if (response) {
      setUserBackgroundInfoOptionsData.value = response;
    }
    isSetUserBackgroundInfoOptionsLoading.value = false;
  };

  const resetAll = () => {
    setUserIdentityData.value = undefined;
    setUserBackgroundInfoData.value = undefined;
    setUserIdentityOptionsData.value = undefined;
    setUserIdentityErrorData.value = undefined;
    setUserBackgroundInfoErrorData.value = undefined;
    getUserIndividualProfileData.value = undefined;
  };

  return {
    resetAll,
    setUserIdentity,
    isSetUserIdentityLoading,
    isSetUserIdentityError,
    setUserIdentityErrorData,
    setUserIdentityData,
    setUserBackgroundInfo,
    isSetUserBackgroundInfoLoading,
    isSetUserBackgroundInfoError,
    setUserBackgroundInfoErrorData,
    setUserBackgroundInfoData,
    setUserIdentityOptions,
    setUserIdentityOptionsData,
    isSetUserIdentityOptionsLoading,
    isSetUserIdentityOptionsError,
    setUserBackgroundInfoOptions,
    isSetUserBackgroundInfoOptionsLoading,
    isSetUserBackgroundInfoOptionsError,
    setUserBackgroundInfoOptionsData,
    getUserIndividualProfile,
    isGetUserIndividualProfileLoading,
    isGetUserIndividualProfileError,
    getUserIndividualProfileData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserIdentitysStore, import.meta.hot));
}
