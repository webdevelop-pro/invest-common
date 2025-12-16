import { describe, it, expect, vi } from 'vitest';
import { reactive, ref, nextTick } from 'vue';
import { FundingTypes } from 'InvestCommon/helpers/enums/general';

import { useInvestFundingForm } from '../useInvestFundingForm';

describe('useInvestFundingForm', () => {
  const baseProps = () =>
    reactive({
      errorData: {},
      schemaBackend: {},
      data: {
        id: 1,
        amount: 100,
        offer: {
          min_investment: 10,
        },
        payment_data: {},
        funding_type: FundingTypes.ach,
      },
      getWalletState: {
        data: {
          totalBalance: 200,
          isWalletStatusAnyError: false,
          funding_source: [
            { id: 1, bank_name: 'Bank', name: 'Account 1' },
          ],
        },
      },
      walletId: 1,
      getEvmWalletState: {
        data: {
          fundingBalance: 300,
          isStatusAnyError: false,
        },
        error: null,
      },
      evmWalletId: 1,
      selectedUserProfileData: {
        data: {
          first_name: 'John',
          last_name: 'Doe',
        },
      },
    });

  it('builds select options including wallet and crypto wallet when available', () => {
    const emit = vi.fn();
    const props = baseProps();

    const composable = useInvestFundingForm(props, emit);

    const options = composable.selectOptions.value;
    const values = options.map((o) => o.value);

    expect(values).toContain(FundingTypes.ach);
    expect(values).toContain(FundingTypes.wire);
    expect(values).toContain(FundingTypes.wallet);
    expect(values).toContain(FundingTypes.cryptoWallet);

    const walletOption = options.find((o) => o.value === FundingTypes.wallet);
    const cryptoOption = options.find((o) => o.value === FundingTypes.cryptoWallet);
    expect(walletOption?.text).toContain('Wallet');
    expect(cryptoOption?.text).toContain('Crypto Wallet');
  });

  it('computes selectErrors based on wallet and crypto balances', () => {
    const emit = vi.fn();
    const props = baseProps();

    const composable = useInvestFundingForm(props, emit);

    // not enough funds in wallet
    props.getWalletState.data.totalBalance = 50;
    composable.model.funding_type = FundingTypes.wallet;
    expect(composable.selectErrors.value[0]).toContain('Wallet does not have enough funds');

    // not enough funds in crypto wallet
    props.getEvmWalletState.data.fundingBalance = 50;
    composable.model.funding_type = FundingTypes.cryptoWallet;
    expect(composable.selectErrors.value[0]).toContain('Crypto wallet does not have enough funds');
  });

  it('combines validation with dynamic form when ACH is selected', () => {
    const emit = vi.fn();
    const props = baseProps();

    const dynamicFormRef = ref({
      isValid: true,
      onValidate: vi.fn(),
      scrollToError: vi.fn(),
    });

    const composable = useInvestFundingForm(props, emit, dynamicFormRef);

    // set funding type to ACH so dynamic form validity is taken into account
    composable.model.funding_type = FundingTypes.ach;
    expect(composable.isValid.value).toBe(true);

    dynamicFormRef.value.isValid = false;
    expect(composable.isValid.value).toBe(false);
    expect(composable.isBtnDisabled.value).toBe(true);
  });

  it('emits componentData changes when emit provided', async () => {
    const emit = vi.fn();
    const props = baseProps();

    const composable = useInvestFundingForm(props, emit);

    composable.componentData.value.accountHolderName = 'John Doe';
    await nextTick();

    const lastCall = emit.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('update:componentData');
    expect(lastCall?.[1]).toMatchObject({ accountHolderName: 'John Doe' });
  });
});


