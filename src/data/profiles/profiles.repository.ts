import { ref, computed } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { ApiClient } from 'UiKit/helpers/api/apiClient';
import env from 'InvestCommon/global';
import { toasterErrorHandling } from 'UiKit/helpers/api/toasterErrorHandling';
import {
  IProfileData, IUserIdentityResponse, IProfileIndividual, ISchema,
} from './profiles.types';

// Generic type for action states
type ActionState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
};

// Utility function to create action states
const createActionState = <T>() => ref<ActionState<T>>({
  data: undefined,
  loading: false,
  error: null,
});

export const useRepositoryProfiles = defineStore('repository-profiles', () => {
  // Dependencies
  const apiClient = new ApiClient(env.USER_URL);

  // State
  const profileOptions = ref<ISchema>();

  // Action states
  const setProfileByIdState = createActionState<IProfileIndividual>();
  const getProfileByIdState = createActionState<IProfileIndividual>();
  const getProfileByIdOptionsState = createActionState<IProfileIndividual>();
  const setProfileState = createActionState<IProfileData>();
  const getUserState = createActionState<IUserIdentityResponse>();
  const setUserState = createActionState<IProfileData>();
  const setUserOptionsState = createActionState<any>();
  const updateUserDataState = createActionState<any>();
  const getProfileOptionsState = createActionState<ISchema>();

  // Computed
  const formattedProfileData = computed(() => setProfileState.data);

  // Actions
  const getProfileOptions = async (type: string) => {
    try {
      getProfileOptionsState.value.loading = true;
      getProfileOptionsState.value.error = null;
      const response = await apiClient.options<ISchema>(`/auth/profile/${type}`);
      getProfileOptionsState.value.data = response.data;
      if (getProfileOptionsState.value.data?.definitions?.RegCF) {
        delete getProfileOptionsState.value.data.definitions.RegCF?.required;
      }
      return getProfileOptionsState.value.data;
    } catch (err) {
      getProfileOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch profile options');
      throw err;
    } finally {
      getProfileOptionsState.value.loading = false;
    }
  };

  const setProfile = async (data: IProfileData, type: string) => {
    try {
      setProfileState.value.loading = true;
      setProfileState.value.error = null;
      const response = await apiClient.post<IProfileData>(`/auth/profile/${type}`, data);
      setProfileState.value.data = response.data;
      return setProfileState.value.data;
    } catch (err) {
      setProfileState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set profile');
      throw err;
    } finally {
      setProfileState.value.loading = false;
    }
  };

  const getProfileById = async (type: string, id: string | number) => {
    try {
      getProfileByIdState.value.loading = true;
      getProfileByIdState.value.error = null;
      const response = await apiClient.get<IProfileIndividual>(`/auth/profile/${type}/${id}`);
      getProfileByIdState.value.data = response.data;
      return getProfileByIdState.value.data;
    } catch (err) {
      getProfileByIdState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch profile by ID');
      throw err;
    } finally {
      getProfileByIdState.value.loading = false;
    }
  };

  const getProfileByIdOptions = async (type: string, id: string | number) => {
    try {
      getProfileByIdOptionsState.value.loading = true;
      getProfileByIdOptionsState.value.error = null;
      const response = await apiClient.options<IProfileIndividual>(`/auth/profile/${type}/${id}`);
      getProfileByIdOptionsState.value.data = response.data;
      return getProfileByIdOptionsState.value.data;
    } catch (err) {
      getProfileByIdOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch profile by ID options');
      throw err;
    } finally {
      getProfileByIdOptionsState.value.loading = false;
    }
  };

  const setProfileById = async (data: IProfileData, type: string, id: string | number) => {
    try {
      setProfileByIdState.value.loading = true;
      setProfileByIdState.value.error = null;
      const response = await apiClient.patch<IProfileIndividual>(`/auth/profile/${type}/${id}`, data);
      setProfileByIdState.value.data = response.data;
      return setProfileByIdState.value.data;
    } catch (err) {
      setProfileByIdState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to update profile');
      throw err;
    } finally {
      setProfileByIdState.value.loading = false;
    }
  };

  const getUser = async () => {
    try {
      getUserState.value.loading = true;
      getUserState.value.error = null;
      const response = await apiClient.get<IUserIdentityResponse>('/auth/user');
      getUserState.value.data = response.data;
      console.log('getUserState.data', getUserState);
      return getUserState.value.data;
    } catch (err) {
      getUserState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch user data');
      throw err;
    } finally {
      getUserState.value.loading = false;
    }
  };

  const setUser = async (data: IProfileData) => {
    try {
      setUserState.value.loading = true;
      setUserState.value.error = null;
      const response = await apiClient.patch<IProfileData>('/auth/user', data);
      setUserState.value.data = response.data;
      return setUserState.value.data;
    } catch (err) {
      setUserState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to update user data');
      throw err;
    } finally {
      setUserState.value.loading = false;
    }
  };

  const setUserOptions = async () => {
    try {
      setUserOptionsState.value.loading = true;
      setUserOptionsState.value.error = null;
      const response = await apiClient.options('/auth/user');
      setUserOptionsState.value.data = response.data;
      return setUserOptionsState.value.data;
    } catch (err) {
      setUserOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch user options');
      throw err;
    } finally {
      setUserOptionsState.value.loading = false;
    }
  };

  const updateUserData = async (id: string | number, body: string) => {
    try {
      updateUserDataState.value.loading = true;
      updateUserDataState.value.error = null;
      const response = await apiClient.patch('/auth/user', body, {
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      updateUserDataState.value.data = response.data;
      return updateUserDataState.value.data;
    } catch (err) {
      updateUserDataState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to update user data');
      throw err;
    } finally {
      updateUserDataState.value.loading = false;
    }
  };

  const reset = () => {
    // Reset all action states
    Object.values({
      setProfileByIdState,
      getProfileByIdState,
      getProfileByIdOptionsState,
      setProfileState,
      getUserState,
      setUserState,
      setUserOptionsState,
      updateUserDataState,
      getProfileOptionsState,
    }).forEach((action) => {
      // eslint-disable-next-line no-param-reassign
      action.value.data = undefined;
      // eslint-disable-next-line no-param-reassign
      action.value.loading = false;
      // eslint-disable-next-line no-param-reassign
      action.value.error = null;
    });
  };

  return {
    // State
    profileOptions,
    // Action states
    setProfileByIdState,
    getProfileByIdState,
    getProfileByIdOptionsState,
    setProfileState,
    getUserState,
    setUserState,
    setUserOptionsState,
    updateUserDataState,
    getProfileOptionsState,
    formattedProfileData,
    // Actions
    getProfileOptions,
    setProfile,
    getProfileById,
    getProfileByIdOptions,
    setProfileById,
    getUser,
    setUser,
    setUserOptions,
    updateUserData,
    reset,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryProfiles, import.meta.hot));
}
