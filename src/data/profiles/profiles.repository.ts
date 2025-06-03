import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'UiKit/helpers/api/apiClient';
import env from 'InvestCommon/global';
import { IProfileData, IUserIdentityResponse } from 'InvestCommon/types/api/invest';
import { IProfileIndividual, ISchema } from 'InvestCommon/types/api/user';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';

export const useRepositoryProfiles = defineStore('repository-profiles', () => {
  // Dependencies
  const apiClient = new ApiClient(env.USER_URL);

  // State
  const profileData = ref<IProfileData>();
  const profileOptions = ref<ISchema>();
  const profileById = ref<IProfileIndividual>();
  const userData = ref<IUserIdentityResponse>();
  const error = ref<Error | null>(null);

  // Loading states
  const isLoadingProfileOptions = ref(false);
  const isLoadingSetProfile = ref(false);
  const isLoadingGetProfileById = ref(false);
  const isLoadingSetProfileById = ref(false);
  const isLoadingGetUser = ref(false);
  const isLoadingSetUser = ref(false);
  const isLoadingSetUserOptions = ref(false);
  const isLoadingUpdateUserData = ref(false);

  // Computed
  const formattedProfileData = computed(() => profileData.value);

  // Actions
  const getProfileOptions = async (type: string) => {
    try {
      isLoadingProfileOptions.value = true;
      error.value = null;
      const response = await apiClient.options<ISchema>(`/auth/profile/${type}`);
      profileOptions.value = response.data;
      if (profileOptions.value.definitions?.RegCF) {
        delete profileOptions.value.definitions.RegCF?.required;
      }
      return profileOptions.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to fetch profile options');
      throw err;
    } finally {
      isLoadingProfileOptions.value = false;
    }
  };

  const setProfile = async (data: IProfileData, type: string) => {
    try {
      isLoadingSetProfile.value = true;
      error.value = null;
      const response = await apiClient.post<IProfileData>(`/auth/profile/${type}`, data);
      profileData.value = response.data;
      return profileData.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to set profile');
      throw err;
    } finally {
      isLoadingSetProfile.value = false;
    }
  };

  const getProfileById = async (type: string, id: string | number) => {
    try {
      isLoadingGetProfileById.value = true;
      error.value = null;
      const response = await apiClient.get<IProfileIndividual>(`/auth/profile/${type}/${id}`);
      profileById.value = response.data;
      return profileById.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to fetch profile by ID');
      throw err;
    } finally {
      isLoadingGetProfileById.value = false;
    }
  };

  const setProfileById = async (data: IProfileData, type: string, id: string | number) => {
    try {
      isLoadingSetProfileById.value = true;
      error.value = null;
      const response = await apiClient.patch<IProfileIndividual>(`/auth/profile/${type}/${id}`, data);
      profileById.value = response.data;
      return profileById.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to update profile');
      throw err;
    } finally {
      isLoadingSetProfileById.value = false;
    }
  };

  const getUser = async () => {
    try {
      isLoadingGetUser.value = true;
      error.value = null;
      const response = await apiClient.get<IUserIdentityResponse>('/auth/user');
      userData.value = response.data;
      return userData.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to fetch user data');
      throw err;
    } finally {
      isLoadingGetUser.value = false;
    }
  };

  const setUser = async (data: IProfileData) => {
    try {
      isLoadingSetUser.value = true;
      error.value = null;
      const response = await apiClient.patch<IProfileData>('/auth/user', data);
      profileData.value = response.data;
      return profileData.value;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to update user data');
      throw err;
    } finally {
      isLoadingSetUser.value = false;
    }
  };

  const setUserOptions = async () => {
    try {
      isLoadingSetUserOptions.value = true;
      error.value = null;
      const response = await apiClient.options('/auth/user');
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to fetch user options');
      throw err;
    } finally {
      isLoadingSetUserOptions.value = false;
    }
  };

  const updateUserData = async (id: string | number, body: string) => {
    try {
      isLoadingUpdateUserData.value = true;
      error.value = null;
      const response = await apiClient.patch('/auth/user', body, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      return response.data;
    } catch (err) {
      error.value = err as Error;
      toasterErrorHandling(err, 'Failed to update user data');
      throw err;
    } finally {
      isLoadingUpdateUserData.value = false;
    }
  };

  const resetAll = () => {
    profileData.value = undefined;
    profileOptions.value = undefined;
    profileById.value = undefined;
    userData.value = undefined;
    error.value = null;
  };

  return {
    // State
    profileData,
    profileOptions,
    profileById,
    userData,
    error,
    formattedProfileData,
    // Loading states
    isLoadingProfileOptions,
    isLoadingSetProfile,
    isLoadingGetProfileById,
    isLoadingSetProfileById,
    isLoadingGetUser,
    isLoadingSetUser,
    isLoadingSetUserOptions,
    isLoadingUpdateUserData,
    // Actions
    getProfileOptions,
    setProfile,
    getProfileById,
    setProfileById,
    getUser,
    setUser,
    setUserOptions,
    updateUserData,
    resetAll,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryProfiles, import.meta.hot));
}
