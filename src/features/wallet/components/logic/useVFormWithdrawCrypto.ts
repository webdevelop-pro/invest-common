import {
  computed, reactive, watch, nextTick,
} from 'vue';
import { storeToRefs } from 'pinia';
import { numberFormatter } from 'UiKit/helpers/numberFormatter';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule } from 'UiKit/helpers/validation/rules';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { useRepositoryEvm } from 'InvestCommon/data/evm/evm.repository';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useWalletAuth } from 'InvestCommon/features/wallet/store/useWalletAuth';
import { walletAuthAdapter } from 'InvestCommon/features/wallet/logic/walletAuth.adapter';
import { IEvmWithdrawRequestBody, IEvmWalletBalances } from 'InvestCommon/data/evm/evm.types';

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  'ethereum-sepolia': 'Ethereum Sepolia',
  polygon: 'Polygon',
  base: 'Base',
};

type WithdrawCryptoFormModel = {
  chain?: string;
  asset?: string;
  amount?: number;
  destination_address?: string;
  idempotency_key?: string;
};

export function useVFormWithdrawCrypto(
  emitClose?: () => void,
) {
  const evmRepository = useRepositoryEvm();
  const profilesStore = useProfilesStore();
  const walletAuthStore = useWalletAuth();
  const { getEvmWalletState, withdrawFundsState } = storeToRefs(evmRepository);
  const { selectedUserProfileId, selectedUserProfileData } = storeToRefs(profilesStore);
  const defaultChain = 'ethereum-sepolia';

  const errorData = computed(() => (withdrawFundsState.value.error as any)?.data?.responseJson);
  const schemaBackend = computed(() => undefined);
  const fieldsPaths = ['chain', 'asset', 'amount', 'destination_address'];

  const selectedToken = computed(() => (
    getEvmWalletState.value.data?.balances?.find((item: IEvmWalletBalances) => item.symbol === model.asset)));
  const maxWithdraw = computed((): number | undefined => selectedToken.value?.amount);
  const text = computed(() => `available ${maxWithdraw.value}`);

  const schemaAddTransaction = computed(() => ({
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      WalletWithdraw: {
        properties: {
          amount: {
            type: 'number',
            maximum: maxWithdraw.value,
            errorMessage: {
              maximum: `Maximum available is $${maxWithdraw.value}`,
            },
          },
          chain: {
            type: 'string',
          },
          asset: {
            type: 'string',
          },
          destination_address: {
            type: 'string',
          },
        },
        type: 'object',
        required: fieldsPaths,
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/WalletWithdraw',
  } as unknown as JSONSchemaType<WithdrawCryptoFormModel>));

  const schemaFrontend = schemaAddTransaction;
  const {
    model,
    validation,
    isValid,
    onValidate,
    scrollToError, formErrors, isFieldRequired, getErrorText,
    getOptions, getReferenceType,
  } = useFormValidation<WithdrawCryptoFormModel>(
    schemaFrontend,
    schemaBackend,
    reactive({} as WithdrawCryptoFormModel),
    fieldsPaths
  );

  const chainOptions = computed(() => {
    const chains = Array.isArray(getEvmWalletState.value.data?.chains) ? getEvmWalletState.value.data?.chains : [];

    return chains
      .map((chain) => {
        const chainKey = String(chain.chain ?? '').trim().toLowerCase();
        return {
          id: chainKey,
          value: chainKey,
          text: CHAIN_LABELS[chainKey] ?? chain.chain,
        };
      })
      .filter((option) => Boolean(option.value));
  });

  const isDisabledButton = computed(() => (!isValid.value || withdrawFundsState.value.loading));

  const openWalletAuthFlow = async () => {
    const profileId = Number(selectedUserProfileId.value ?? 0);
    if (!profileId) {
      return;
    }

    await walletAuthStore.startFlowForProfile({
      profileId,
      profileType: selectedUserProfileData.value?.type,
      profileName: selectedUserProfileData.value?.name,
      fullAccountName: selectedUserProfileData.value?.data?.full_account_name,
      userEmail: selectedUserProfileData.value?.data?.email,
      walletStatus: selectedUserProfileData.value?.wallet?.status,
      isKycApproved: selectedUserProfileData.value?.isKycApproved,
    });
  };

  const createIdempotencyKey = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `wdr_${crypto.randomUUID()}`;
    }

    return `wdr_${Date.now()}`;
  };

  const saveHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormWithdrawCrypto'));
      return;
    }

    const profileId = Number(selectedUserProfileId.value ?? 0);
    if (!profileId) {
      return;
    }

    const idempotencyKey = model.idempotency_key || createIdempotencyKey();
    model.idempotency_key = idempotencyKey;

    const authorizeStart = await evmRepository.authorizeWithdrawStart(profileId, {
      chain: String(model.chain),
      asset: String(model.asset),
      max_amount: String(model.amount),
      nonce: idempotencyKey,
    });

    let ownerSignature = '';
    try {
      ownerSignature = await walletAuthAdapter.signAuthorizationRequest(authorizeStart.signature_request);
    } catch {
      await openWalletAuthFlow();
      return;
    }

    await evmRepository.authorizeWithdrawConfirm(profileId, {
      session_id: authorizeStart.session_id,
      owner_signature: ownerSignature,
    });

    const data: IEvmWithdrawRequestBody = {
      chain: String(model.chain),
      asset: String(model.asset),
      amount: String(model.amount),
      destination_address: String(model.destination_address),
      idempotency_key: idempotencyKey,
    };
    await evmRepository.withdrawFunds(profileId, data);
    if (withdrawFundsState.value.error) return;

    await evmRepository.getEvmWalletByProfile(profileId);
    if (emitClose) emitClose();
  };

  const cancelHandler = () => {
    if (emitClose) emitClose();
  };

  watch(() => model.amount, (newAmount) => {
    if (Number(newAmount) === 0) {
      (model as any).amount = undefined;
    }
  });

  watch(() => getEvmWalletState.value.data, () => {
    if (!model.chain) {
      const preferredChain = chainOptions.value.find((item) => item.value === defaultChain)?.value;
      model.chain = preferredChain || String(chainOptions.value[0]?.value || '');
    }
  }, { immediate: true });

  // Helper function to format token data
  const formatToken = (item: any) => ({
    ...item,
    text: `${item.name}: ${item.symbol}`,
    id: item.symbol,
  });

  const tokenFormatted = computed(() => {
    const balances = getEvmWalletState.value.data?.balances || [];
    const uniqueTokens = new Map();
    
    balances.forEach((item: any) => {
      const key = `${item.name}:${item.symbol}`;
      if (!uniqueTokens.has(key)) {
        uniqueTokens.set(key, formatToken(item));
      }
    });
    
    return Array.from(uniqueTokens.values());
  });

  const tokenLastItem = computed(() => (
    tokenFormatted.value[0] || null
  ));

  watch(() => tokenFormatted.value, () => {
    if (!model.asset) model.asset = String(tokenLastItem.value?.id || '');
  }, { immediate: true });

  return {
    model,
    validation,
    isValid,
    isDisabledButton,
    onValidate,
    saveHandler,
    cancelHandler,
    text,
    errorData,
    schemaAddTransaction,
    chainOptions,
    tokenFormatted,
    numberFormatter,
    withdrawFundsState,
    
    // Form validation helpers
    formErrors,
    isFieldRequired,
    getErrorText,
    getOptions,
    getReferenceType,
    scrollToError,
  };
}
