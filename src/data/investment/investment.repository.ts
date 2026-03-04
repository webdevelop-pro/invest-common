import { ApiClient } from 'InvestCommon/data/service/apiClient';
import {
  IInvestUnconfirmed,
  IInvestConfirm,
  IInvestFunding,
} from 'InvestCommon/data/investment/investment.types';
import env from 'InvestCommon/config/env';
import { createRepositoryStates, withActionState, type OptionsStateData } from 'InvestCommon/data/repository/repository';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { InvestmentFormatter } from 'InvestCommon/data/investment/investment.formatter';
import { IInvestmentFormatted, IInvestment, IInvestmentsData, IInvestmentsDataRaw } from 'InvestCommon/data/investment/investment.types';
import { ref, computed } from 'vue';
import { INotification } from 'InvestCommon/data/notifications/notifications.types';

const { INVESTMENT_URL } = env;

type InvestmentStates = {
  getInvestmentsState: IInvestmentsData;
  getInvestOneState: IInvestmentFormatted;
  getInvestUnconfirmedState: IInvestUnconfirmed;
  setInvestState: IInvestment;
  setAmountState: { number_of_shares: number };
  setOwnershipState: { step: string };
  setSignatureState: OptionsStateData;
  setFundingState: OptionsStateData;
  setReviewState: IInvestConfirm;
  cancelInvestState: OptionsStateData;
  updateNotesState: { notes: string };
  setAmountOptionsState: OptionsStateData;
  setOwnershipOptionsState: OptionsStateData;
  setFundingOptionsState: OptionsStateData;
  setCancelOptionsState: OptionsStateData;
};

export const useRepositoryInvestment = defineStore('repository-investment', () => {
  const apiClient = new ApiClient(INVESTMENT_URL);

  const createEmptyInvestmentFormatted = (): IInvestmentFormatted => (
    new InvestmentFormatter({} as IInvestment).format()
  );

  const {
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
    updateNotesState,
    setAmountOptionsState,
    setOwnershipOptionsState,
    setFundingOptionsState,
    setCancelOptionsState,
    resetAll: resetActionStates,
  } = createRepositoryStates<InvestmentStates>({
    getInvestOneState: createEmptyInvestmentFormatted(),
    getInvestmentsState: undefined,
    getInvestUnconfirmedState: undefined,
    setInvestState: undefined,
    setAmountState: undefined,
    setOwnershipState: undefined,
    setSignatureState: undefined,
    setFundingState: undefined,
    setReviewState: undefined,
    cancelInvestState: undefined,
    updateNotesState: undefined,
    setAmountOptionsState: undefined,
    setOwnershipOptionsState: undefined,
    setFundingOptionsState: undefined,
    setCancelOptionsState: undefined,
  });

  const currentUnconfirmedSlug = ref<string | null>(null);
  const currentUnconfirmedId = ref<number | null>(null);
  const getInvestUnconfirmedOne = computed<IInvestmentFormatted>(() => {
    const list = getInvestUnconfirmedState.value.data?.data as IInvestmentFormatted[] | undefined;

    if (!list || !list.length) {
      return createEmptyInvestmentFormatted();
    }

    if (currentUnconfirmedId.value !== null) {
      const byId = list.find(
        (investment: IInvestmentFormatted) => investment?.id === currentUnconfirmedId.value,
      );
      if (byId) return byId;
    }

    if (currentUnconfirmedSlug.value) {
      const bySlug = list.find(
        (investment: IInvestmentFormatted) => investment?.offer?.slug === currentUnconfirmedSlug.value,
      );
      if (bySlug) return bySlug;
    }

    return createEmptyInvestmentFormatted();
  });

  const getInvestments = async (id: string) =>
    withActionState(getInvestmentsState, async () => {
      const response = await apiClient.get<IInvestmentsDataRaw>(`/auth/investment/${id}/confirmed`);
      const rawData = response.data;
      const emptyMeta: IInvestmentsData['meta'] = {
        avarange_annual: 0,
        total_distributions: 0,
        total_investments_12_months: 0,
        total_investments: 0,
      };
      if (!rawData || !Array.isArray(rawData.data)) {
        return { meta: rawData?.meta ?? emptyMeta, count: rawData?.count ?? 0, data: [] };
      }
      const formattedData: IInvestmentsData = {
        ...rawData,
        data: rawData.data.map((investment) => new InvestmentFormatter(investment).format()),
      };
      return formattedData;
    });

  const getInvestOne = async (id: string) =>
    withActionState(getInvestOneState, async () => {
      const response = await apiClient.get(`/auth/investment/${id}`);
      const investmentData = response.data as IInvestment;
      return new InvestmentFormatter(investmentData).format();
    });

  const getInvestUnconfirmed = async (
    slug: string,
    profileId: number | string,
    investmentId?: number | string,
  ) => {
    const result = await withActionState(getInvestUnconfirmedState, async () => {
      const response = await apiClient.get(`/auth/investment/${profileId}/unconfirmed`);
      const rawData = response.data as IInvestUnconfirmed;
      // API type declares data as IInvestmentFormatted[] but backend returns raw; we format here.
      const formattedData = rawData.data && Array.isArray(rawData.data)
        ? {
            ...rawData,
            data: (rawData.data as unknown as IInvestment[]).map((investment) =>
              new InvestmentFormatter(investment).format(),
            ),
          }
        : rawData;
      currentUnconfirmedSlug.value = slug;
      if (typeof investmentId !== 'undefined' && investmentId !== null) {
        const parsedId = Number(investmentId);
        currentUnconfirmedId.value = Number.isNaN(parsedId) ? null : parsedId;
      } else {
        currentUnconfirmedId.value = null;
      }
      return formattedData;
    });
    return result || null;
  };

  const setInvest = async (slug: string, profileId: string, sharesCount: number) =>
    withActionState(setInvestState, async () => {
      const response = await apiClient.post(`/auth/invest/${slug}/${profileId}`, {
        number_of_shares: sharesCount,
      });
      return response.data as IInvestment;
    });

  const setAmount = async (slug: string, id: string, profileId: string, data: object) =>
    withActionState(setAmountState, async () => {
      const response = await apiClient.put(`/auth/invest/${slug}/amount/${id}/${profileId}`, data);
      return response.data as {number_of_shares: number};
    });

  const setOwnership = async (slug: string, id: string, profileId: string) =>
    withActionState(setOwnershipState, async () => {
      const response = await apiClient.put(`/auth/invest/${slug}/ownership/${id}/${profileId}`, {});
      return response.data as {step: string};
    });

  const setSignature = async (
    slug: string,
    id: string,
    profileId: string,
    signUrlId: string,
    deviceInfo?: { userAgent?: string; ipAddress?: string },
  ) =>
    withActionState(setSignatureState, async () => {
      const userAgent = deviceInfo?.userAgent ?? '';
      const ipAddress = deviceInfo?.ipAddress ?? '';
      const response = await apiClient.put(`/auth/invest/${slug}/signature/${id}/${profileId}`, {
        signature_id: signUrlId,
        user_browser: userAgent,
        ip_address: ipAddress,
      });
      return response.data;
    });

  const setFunding = async (slug: string, id: string, profileId: string, fundingData: IInvestFunding) =>
    withActionState(setFundingState, async () => {
      const response = await apiClient.put(`/auth/invest/${slug}/funding/${id}/${profileId}`, fundingData);
      return response.data;
    });

  const setReview = async (slug: string, id: string, profileId: string) =>
    withActionState(setReviewState, async () => {
      const response = await apiClient.put(`/auth/invest/${slug}/review/${id}/${profileId}`, {});
      return response.data as IInvestConfirm;
    });

  const cancelInvest = async (id: string, reason: string) =>
    withActionState(cancelInvestState, async () => {
      const response = await apiClient.put(`/auth/investment/${id}/cancel`, {
        cancelation_reason: reason,
      });
      return response.data;
    });

  const updateInvestmentNotes = async (id: string, notes: string) =>
    withActionState(updateNotesState, async () => {
      const response = await apiClient.patch(`/auth/investment/${id}`, { notes });
      const notesData = response.data as { notes: string };
      const current = getInvestOneState.value.data;
      if (current) {
        getInvestOneState.value.data = new InvestmentFormatter({
          ...(current as unknown as IInvestment),
          notes,
        }).format();
      }
      return notesData;
    });

  const setAmountOptions = async (slug: string, id: string, profileId: string) =>
    withActionState(setAmountOptionsState, async () => {
      const response = await apiClient.options(`/auth/invest/${slug}/amount/${id}/${profileId}`);
      return response.data;
    });

  const setOwnershipOptions = async (slug: string, id: string, profileId: string) =>
    withActionState(setOwnershipOptionsState, async () => {
      const response = await apiClient.options(`/auth/invest/${slug}/ownership/${id}/${profileId}`);
      return response.data;
    });

  const setFundingOptions = async (slug: string, id: string, profileId: string) =>
    withActionState(setFundingOptionsState, async () => {
      const response = await apiClient.options(`/auth/invest/${slug}/funding/${id}/${profileId}`);
      return response.data;
    });

  const setCancelOptions = async (id: string) =>
    withActionState(setCancelOptionsState, async () => {
      const response = await apiClient.options(`/auth/investment/${id}/cancel`);
      return response.data;
    });

  const resetAll = () => {
    resetActionStates();
    currentUnconfirmedSlug.value = null;
    currentUnconfirmedId.value = null;
  };

  const setCurrentUnconfirmedFilter = (payload: { slug?: string | null; id?: number | null }) => {
    if (Object.prototype.hasOwnProperty.call(payload, 'slug')) {
      currentUnconfirmedSlug.value = payload.slug ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'id')) {
      currentUnconfirmedId.value = payload.id ?? null;
    }
  };

  /** Normalize WS payload: signature_id may come as number, app uses string */
  const normalizeFields = (fields: INotification['data']['fields']) => {
    const normalized = { ...fields } as Record<string, unknown>;
    const sd = normalized.signature_data as Record<string, unknown> | undefined;
    if (sd && typeof sd.signature_id !== 'undefined') {
      normalized.signature_data = { ...sd, signature_id: String(sd.signature_id) };
    }
    return normalized;
  };

  const updateNotificationData = (notification: INotification) => {
    const { fields } = notification.data ?? {};
    if (!fields || typeof fields.object_id === 'undefined') return;

    const objectId = Number(fields.object_id);
    if (Number.isNaN(objectId)) return;

    const normalizedFields = normalizeFields(fields);

    const one = getInvestOneState.value.data;
    if (one) {
      const updated = { ...one, ...normalizedFields } as unknown as IInvestment;
      getInvestOneState.value.data = new InvestmentFormatter(updated).format();
    }

    const investmentsData = getInvestmentsState.value.data;
    if (investmentsData?.data?.length) {
      const index = investmentsData.data.findIndex((t: IInvestmentFormatted) => t.id === objectId);
      if (index >= 0) {
        const newData = investmentsData.data.map((item, i) =>
          i === index
            ? new InvestmentFormatter({ ...item, ...normalizedFields } as unknown as IInvestment).format()
            : item,
        );
        getInvestmentsState.value.data = { ...investmentsData, data: newData };
      }
    }
    const unconfirmedData = getInvestUnconfirmedState.value.data;
    const unconfirmedList = unconfirmedData?.data as IInvestmentFormatted[] | undefined;
    if (unconfirmedList?.length) {
      const index = unconfirmedList.findIndex((t: IInvestmentFormatted) => t.id === objectId);
      if (index >= 0) {
        const newUnconfirmedList = unconfirmedList.map((item, i) =>
          i === index
            ? new InvestmentFormatter({ ...item, ...normalizedFields } as unknown as IInvestment).format()
            : item,
        );
        getInvestUnconfirmedState.value.data = {
          ...unconfirmedData,
          data: newUnconfirmedList,
        } as typeof unconfirmedData;
      }
    }
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
    updateNotesState,
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
    updateInvestmentNotes,
    setAmountOptions,
    setOwnershipOptions,
    setFundingOptions,
    setCancelOptions,
    resetAll,
    updateNotificationData,
    setCurrentUnconfirmedFilter,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useRepositoryInvestment, import.meta.hot));
}
