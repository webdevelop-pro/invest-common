import { ref } from 'vue';
import { IProfileData, IUserIdentityResponse } from 'InvestCommon/types/api/invest';
import {
  fetchSetProfile, fetchSetUser, fetchProfileOptions,
  fetchSetUserOptions, fetchGetProfileByID,
  fetchGetUser,
  fetchProfileByIDOptions,
  fetchSetProfileByID, fetchSetUserData,
} from 'InvestCommon/services/api/user';
import { generalErrorHandling } from 'UiKit/helpers/generalErrorHandling';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { IProfileIndividual, ISchema } from 'InvestCommon/types/api/user';

export const useUserProfilesStore = defineStore('userProfile', () => {
  const isGetProfileOptionsLoading = ref(false);
  const isGetProfileOptionsError = ref(false);
  const getProfileOptionsData = ref<ISchema>();
  const getProfileOptions = async (type: string) => {
    isGetProfileOptionsLoading.value = true;
    isGetProfileOptionsError.value = false;
    const response = await fetchProfileOptions(type).catch((error: Response) => {
      isGetProfileOptionsError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getProfileOptionsData.value = response;
      if (getProfileOptionsData.value.definitions?.RegCF) {
        delete getProfileOptionsData.value.definitions.RegCF?.required;
      }
    }
    isGetProfileOptionsLoading.value = false;
  };

  const isSetUserProfileLoading = ref(false);
  const isSetUserProfileError = ref(false);
  const setProfileData = ref<IProfileData>();
  const setProfileErrorData = ref();
  const setProfile = async (data: IProfileData, type: string) => {
    isSetUserProfileLoading.value = true;
    isSetUserProfileError.value = false;
    setProfileErrorData.value = undefined;
    const response = await fetchSetProfile(data, type).catch(async (error: Response) => {
      isSetUserProfileError.value = true;
      setProfileErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) {
      setProfileData.value = response;
    }
    isSetUserProfileLoading.value = false;
  };

  const isGetProfileByIdLoading = ref(false);
  const isGetProfileByIdError = ref(false);
  const getProfileByIdData = ref<IProfileIndividual>();
  const getProfileById = async (type: string, id: string | number) => {
    isGetProfileByIdLoading.value = true;
    isGetProfileByIdError.value = false;
    const response = await fetchGetProfileByID(type, id).catch((error: Response) => {
      isGetProfileByIdError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getProfileByIdData.value = response;
    }
    isGetProfileByIdLoading.value = false;
  };

  const isGetProfileByIdOptionsLoading = ref(false);
  const isGetProfileByIdOptionsError = ref(false);
  const getProfileByIdOptionsData = ref<IProfileIndividual>();
  const getProfileByIdOptions = async (type: string, id: string | number) => {
    isGetProfileByIdOptionsLoading.value = true;
    isGetProfileByIdOptionsError.value = false;
    const response = await fetchProfileByIDOptions(type, id).catch((error: Response) => {
      isGetProfileByIdOptionsError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getProfileByIdOptionsData.value = response;
    }
    isGetProfileByIdOptionsLoading.value = false;
  };

  const isSetProfileByIdLoading = ref(false);
  const isSetProfileByIdError = ref(false);
  const setProfileByIdData = ref<IProfileIndividual>();
  const setProfileByIdErrorData = ref();
  const setProfileById = async (data: IProfileData, type: string, id: string | number) => {
    isSetProfileByIdLoading.value = true;
    isSetProfileByIdError.value = false;
    const response = await fetchSetProfileByID(data, type, id).catch(async (error: Response) => {
      isSetProfileByIdError.value = true;
      setProfileErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) {
      setProfileByIdData.value = response;
    }
    isSetProfileByIdLoading.value = false;
  };

  const isGetUserLoading = ref(false);
  const isGetUserError = ref(false);
  const getUserData = ref<IUserIdentityResponse>();
  const getUser = async () => {
    isGetUserLoading.value = true;
    isGetUserError.value = false;
    const response = await fetchGetUser().catch((error: Response) => {
      isGetUserError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      getUserData.value = response;
    }
    isGetUserLoading.value = false;
    return getUserData.value;
  };

  const isSetUserLoading = ref(false);
  const isSetUserError = ref(false);
  const setUserData = ref<IProfileData>();
  const setUserErrorData = ref();
  const setUser = async (data: IProfileData) => {
    isSetUserLoading.value = true;
    isSetUserError.value = false;
    const response = await fetchSetUser(data).catch(async (error: Response) => {
      isSetUserError.value = true;
      setUserErrorData.value = JSON.parse(await error.text());
      generalErrorHandling(error);
    });
    if (response) {
      setUserData.value = response;
    }
    isSetUserLoading.value = false;
  };

  const isSetUserOptionsLoading = ref(false);
  const isSetUserOptionsError = ref(false);
  const setUserOptionsData = ref();
  const setUserOptions = async () => {
    isSetUserOptionsLoading.value = true;
    isSetUserOptionsError.value = false;
    const response = await fetchSetUserOptions().catch((error: Response) => {
      isSetUserOptionsError.value = true;
      generalErrorHandling(error);
    });
    if (response) {
      setUserOptionsData.value = response;
    }
    isSetUserOptionsLoading.value = false;
  };

  const isupdateUserDataLoading = ref(false);
  const updateUserDataError = ref();
  const updateUserDataData = ref();
  const updateUserData = async (id: string | number, body: string) => {
    isupdateUserDataLoading.value = true;
    updateUserDataData.value = null;
    updateUserDataError.value = null;
    const response = await fetchSetUserData(id, body).catch(async (error: Response) => {
      updateUserDataError.value = error;
      generalErrorHandling(error);
    });
    if (response) {
      updateUserDataData.value = response;
    }
    isupdateUserDataLoading.value = false;
  };

  const resetAll = () => {
    setProfileData.value = undefined;
    setProfileErrorData.value = undefined;
    setUserData.value = undefined;
    setUserErrorData.value = undefined;
    getProfileOptionsData.value = undefined;
    setUserOptionsData.value = undefined;
    getProfileByIdData.value = undefined;
    setProfileByIdData.value = undefined;
    setProfileByIdErrorData.value = undefined;
    getProfileByIdOptionsData.value = undefined;
    getUserData.value = undefined;
    updateUserDataData.value = undefined;
  };

  return {
    resetAll,
    setProfile,
    isSetUserProfileLoading,
    isSetUserProfileError,
    setProfileErrorData,
    setProfileData,
    getProfileOptions,
    getProfileOptionsData,
    isGetProfileOptionsLoading,
    isGetProfileOptionsError,
    setUserOptions,
    isSetUserOptionsLoading,
    isSetUserOptionsError,
    setUserOptionsData,
    setProfileById,
    isSetProfileByIdLoading,
    isSetProfileByIdError,
    setProfileByIdData,
    setProfileByIdErrorData,
    getProfileById,
    isGetProfileByIdLoading,
    isGetProfileByIdError,
    getProfileByIdData,
    getProfileByIdOptions,
    isGetProfileByIdOptionsLoading,
    isGetProfileByIdOptionsError,
    getProfileByIdOptionsData,
    getUser,
    isGetUserLoading,
    isGetUserError,
    getUserData,
    setUser,
    isSetUserLoading,
    isSetUserError,
    setUserErrorData,
    setUserData,
    updateUserData,
    isupdateUserDataLoading,
    updateUserDataError,
    updateUserDataData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserProfilesStore, import.meta.hot));
}
