import { ApiClient } from 'InvestCommon/data/service/apiClient';
import { toasterErrorHandling } from 'InvestCommon/data/repository/error/toasterErrorHandling';
import {
  IInvestUnconfirmed, IInvestConfirm,
  IInvestFunding,
} from 'InvestCommon/types/api/invest';
import env from 'InvestCommon/domain/config/env';
import { createActionState } from 'InvestCommon/data/repository/repository';
import { storeToRefs, acceptHMRUpdate, defineStore } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { InvestmentFormatter } from 'InvestCommon/data/investment/investment.formatter';
import { IInvestmentFormatted, IInvestment, IInvestmentsData } from 'InvestCommon/data/investment/investment.types';
import { ref } from 'vue';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';

const { INVESTMENT_URL } = env;

export const useRepositoryInvestment = defineStore('repository-investment', () => {
  const apiClient = new ApiClient(INVESTMENT_URL);

  // Create action states for each function
  const getInvestmentsState = createActionState<IInvestmentsData>();
  const getInvestOneState = createActionState<IInvestmentFormatted>(new InvestmentFormatter().format());
  const getInvestUnconfirmedState = createActionState<IInvestUnconfirmed>();
  const getInvestUnconfirmedOne = ref<IInvestmentFormatted>(new InvestmentFormatter().format());
  const setInvestState = createActionState<IInvestment>();
  const setAmountState = createActionState<{number_of_shares: number}>();
  const setOwnershipState = createActionState<{step: string}>();
  const setSignatureState = createActionState<any>();
  const setFundingState = createActionState<any>();
  const setReviewState = createActionState<IInvestConfirm>();
  const cancelInvestState = createActionState<any>();
  const setAmountOptionsState = createActionState<any>();
  const setOwnershipOptionsState = createActionState<any>();
  const setFundingOptionsState = createActionState<any>();
  const setCancelOptionsState = createActionState<any>();

  const getInvestments = async (id: string) => {
    try {
      getInvestmentsState.value.loading = true;
      getInvestmentsState.value.error = null;
      const response = await apiClient.get(`/auth/investment/${id}/confirmed`);
      const rawData = response.data as any;

      // Format investments if data array exists
      const formattedData = rawData.data && Array.isArray(rawData.data)
        ? {
          ...rawData,
          data: rawData.data.map((investment: any) => new InvestmentFormatter(investment as IInvestment).format()),
        }
        : rawData;

      getInvestmentsState.value.data = formattedData;
      return formattedData;
    } catch (err) {
      getInvestmentsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch investments');
      throw err;
    } finally {
      getInvestmentsState.value.loading = false;
    }
  };

  const getInvestOne = async (id: string) => {
    try {
      getInvestOneState.value.loading = true;
      getInvestOneState.value.error = null;
      const response = await apiClient.get(`/auth/investment/${id}`);
      const investmentData = response.data as IInvestment;
      const formatter = new InvestmentFormatter(investmentData);
      const formattedData = formatter.format();
      getInvestOneState.value.data = formattedData;
      return formattedData;
    } catch (err) {
      getInvestOneState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch investment');
      throw err;
    } finally {
      getInvestOneState.value.loading = false;
    }
  };


  const getInvestUnconfirmed = async (slug: string, profileId: number | string) => {
    try {
      getInvestUnconfirmedState.value.loading = true;
      getInvestUnconfirmedState.value.error = null;
      const response = await apiClient.get(`/auth/investment/${profileId}/unconfirmed`);
      const rawData = response.data as IInvestUnconfirmed;
      
      // Format investments if data array exists
      const formattedData = rawData.data && Array.isArray(rawData.data)
        ? {
          ...rawData,
          data: rawData.data.map((investment: any) => new InvestmentFormatter(investment as IInvestment).format()),
        }
        : rawData;

      // Find the specific investment by slug
      getInvestUnconfirmedOne.value = formattedData.data?.find(
        (investment: any) => investment?.offer?.slug === slug
      );

      getInvestUnconfirmedState.value.data = formattedData;
      return getInvestUnconfirmedState.value.data || null;
    } catch (err) {
      getInvestUnconfirmedState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to fetch unconfirmed investments');
      throw err;
    } finally {
      getInvestUnconfirmedState.value.loading = false;
    }
  };

  const setInvest = async (slug: string, profileId: string, sharesCount: number) => {
    try {
      setInvestState.value.loading = true;
      setInvestState.value.error = null;
      const response = await apiClient.post(`/auth/invest/${slug}/${profileId}`, {
        number_of_shares: sharesCount,
      });
      setInvestState.value.data = response.data as IInvestment;
      return response.data as IInvestment;
    } catch (err) {
      setInvestState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set investment');
      throw err;
    } finally {
      setInvestState.value.loading = false;
    }
  };

  const setAmount = async (slug: string, id: string, profileId: string, shares: number) => {
    try {
      setAmountState.value.loading = true;
      setAmountState.value.error = null;
      const response = await apiClient.put(`/auth/invest/${slug}/amount/${id}/${profileId}`, {
        number_of_shares: shares,
      });
      setAmountState.value.data = response.data as {number_of_shares: number};
      return response.data as {number_of_shares: number};
    } catch (err) {
      setAmountState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set amount');
      throw err;
    } finally {
      setAmountState.value.loading = false;
    }
  };

  const setOwnership = async (slug: string, id: string, profileId: string) => {
    try {
      setOwnershipState.value.loading = true;
      setOwnershipState.value.error = null;
      const response = await apiClient.put(`/auth/invest/${slug}/ownership/${id}/${profileId}`, {});
      setOwnershipState.value.data = response.data as {step: string};
      return response.data as {step: string};
    } catch (err) {
      setOwnershipState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set ownership');
      throw err;
    } finally {
      setOwnershipState.value.loading = false;
    }
  };

  const setSignature = async (slug: string, id: string, profileId: string, signUrlId: string) => {
    try {
      setSignatureState.value.loading = true;
      setSignatureState.value.error = null;

      const userSessionStore = useSessionStore();
      const { userSession } = storeToRefs(userSessionStore);

      const response = await apiClient.put(`/auth/invest/${slug}/signature/${id}/${profileId}`, {
        signature_id: signUrlId,
        user_browser: userSession.value?.devices[0].user_agent || '',
        ip_address: userSession.value?.devices[0].ip_address || '',
      });
      setSignatureState.value.data = response.data;
      return response.data;
    } catch (err) {
      setSignatureState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set signature');
      throw err;
    } finally {
      setSignatureState.value.loading = false;
    }
  };



  const setFunding = async (slug: string, id: string, profileId: string, fundingData: IInvestFunding) => {
    try {
      setFundingState.value.loading = true;
      setFundingState.value.error = null;
      const response = await apiClient.put(`/auth/invest/${slug}/funding/${id}/${profileId}`, fundingData);
      setFundingState.value.data = response.data;
      return response.data;
    } catch (err) {
      setFundingState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set funding');
      throw err;
    } finally {
      setFundingState.value.loading = false;
    }
  };

  const setReview = async (slug: string, id: string, profileId: string) => {
    try {
      setReviewState.value.loading = true;
      setReviewState.value.error = null;
      const response = await apiClient.put(`/auth/invest/${slug}/review/${id}/${profileId}`, {});
      setReviewState.value.data = response.data as IInvestConfirm;
      return response.data as IInvestConfirm;
    } catch (err) {
      setReviewState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to set review');
      throw err;
    } finally {
      setReviewState.value.loading = false;
    }
  };

  const cancelInvest = async (id: string, reason: string) => {
    try {
      cancelInvestState.value.loading = true;
      cancelInvestState.value.error = null;
      const response = await apiClient.put(`/auth/investment/${id}/cancel`, {
        cancelation_reason: reason,
      });
      cancelInvestState.value.data = response.data;
      return response.data;
    } catch (err) {
      cancelInvestState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to cancel investment');
      throw err;
    } finally {
      cancelInvestState.value.loading = false;
    }
  };

  const setAmountOptions = async (slug: string, id: string, profileId: string) => {
    try {
      setAmountOptionsState.value.loading = true;
      setAmountOptionsState.value.error = null;
      const response = await apiClient.options(`/auth/invest/${slug}/amount/${id}/${profileId}`);
      setAmountOptionsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setAmountOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get amount options');
      throw err;
    } finally {
      setAmountOptionsState.value.loading = false;
    }
  };

  const setOwnershipOptions = async (slug: string, id: string, profileId: string) => {
    try {
      setOwnershipOptionsState.value.loading = true;
      setOwnershipOptionsState.value.error = null;
      const response = await apiClient.options(`/auth/invest/${slug}/ownership/${id}/${profileId}`);
      setOwnershipOptionsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setOwnershipOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get ownership options');
      throw err;
    } finally {
      setOwnershipOptionsState.value.loading = false;
    }
  };

  const setFundingOptions = async (slug: string, id: string, profileId: string) => {
    try {
      setFundingOptionsState.value.loading = true;
      setFundingOptionsState.value.error = null;
      const response = await apiClient.options(`/auth/invest/${slug}/funding/${id}/${profileId}`);
      setFundingOptionsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setFundingOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get funding options');
      throw err;
    } finally {
      setFundingOptionsState.value.loading = false;
    }
  };

  const setCancelOptions = async (id: string) => {
    try {
      setCancelOptionsState.value.loading = true;
      setCancelOptionsState.value.error = null;
      const response = await apiClient.options(`/auth/investment/${id}/cancel`);
      setCancelOptionsState.value.data = response.data;
      return response.data;
    } catch (err) {
      setCancelOptionsState.value.error = err as Error;
      toasterErrorHandling(err, 'Failed to get cancel options');
      throw err;
    } finally {
      setCancelOptionsState.value.loading = false;
    }
  };

  const resetAll = () => {
    getInvestmentsState.value = { loading: false, error: null, data: undefined };
    getInvestOneState.value = { loading: false, error: null, data: undefined };
    getInvestUnconfirmedState.value = { loading: false, error: null, data: undefined };
    setInvestState.value = { loading: false, error: null, data: undefined };
    setAmountState.value = { loading: false, error: null, data: undefined };
    setOwnershipState.value = { loading: false, error: null, data: undefined };
    setSignatureState.value = { loading: false, error: null, data: undefined };
    setFundingState.value = { loading: false, error: null, data: undefined };
    setReviewState.value = { loading: false, error: null, data: undefined };
    cancelInvestState.value = { loading: false, error: null, data: undefined };
    setAmountOptionsState.value = { loading: false, error: null, data: undefined };
    setOwnershipOptionsState.value = { loading: false, error: null, data: undefined };
    setFundingOptionsState.value = { loading: false, error: null, data: undefined };
    setCancelOptionsState.value = { loading: false, error: null, data: undefined };
    getInvestUnconfirmedOne.value = new InvestmentFormatter().format();
  };

  const updateNotificationData = (notification: INotification) => {
    const { fields } = notification.data;
    const objectId = fields?.object_id;
    Object.assign(getInvestOneState.value.data, fields);  
    getInvestOneState.value.data = new InvestmentFormatter(getInvestOneState.value.data).format();

    if (!getInvestmentsState.value.data) {
      getInvestmentsState.value.data = [];
    }
    const index = getInvestmentsState.value.data?.findIndex((t) => t.id === objectId);
    Object.assign(getInvestmentsState.value.data[index], fields);
    Object.assign(
      getInvestmentsState.value.data[index], 
      new InvestmentFormatter(getInvestmentsState.value.data[index]).format()
    );
  };

  return {
    // States
    getInvestmentsState,
    getInvestOneState,
    getInvestUnconfirmedState,
    setInvestState,
    setAmountState,
    setOwnershipState,
    setSignatureState,
    setFundingState,
    setReviewState,
    cancelInvestState,
    setAmountOptionsState,
    setOwnershipOptionsState,
    setFundingOptionsState,
    setCancelOptionsState,
    getInvestUnconfirmedOne,

    // Functions
    getInvestments,
    getInvestOne,
    getInvestUnconfirmed,
    setInvest,
    setAmount,
    setOwnership,
    setSignature,
    setFunding,
    setReview,
    cancelInvest,
    setAmountOptions,
    setOwnershipOptions,
    setFundingOptions,
    setCancelOptions,
    resetAll,
    updateNotificationData,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryInvestment, import.meta.hot));
}
