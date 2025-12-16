import { describe, it, expect, vi } from 'vitest';
import { reactive, nextTick } from 'vue';

import { useInvestAmountForm } from '../useInvestAmountForm';

describe('useInvestAmountForm', () => {
  it('calculates min/max investment and derived amounts from props.data', () => {
    const emit = vi.fn();

    const props = reactive({
      modelValue: undefined as any,
      errorData: undefined as any,
      data: {
        number_of_shares: 5,
        offer: {
          price_per_share: 10,
          total_shares: 100,
          subscribed_shares: 20,
          min_investment: 2,
        },
      },
      backendSchema: {},
      isLoading: false,
    });

    const composable = useInvestAmountForm(props, emit);

    // maxInvestment = total_shares - subscribed_shares
    expect(composable.maxInvestment.value).toBe(80);
    expect(composable.minInvestment.value).toBe(2);

    // watcher with immediate: true should sync model from data.number_of_shares
    expect(composable.model.number_of_shares).toBe(5);

    // update model and check derived amounts
    composable.model.number_of_shares = 7;
    expect(composable.sharesAmount.value).toBe(7);
    expect(composable.investmentAmount.value).toBe(70);
    expect(composable.investmentAmountShow.value).toBeDefined();
  });

  it('emits update:modelValue when model changes', async () => {
    const emit = vi.fn();

    const props = reactive({
      modelValue: undefined as any,
      errorData: undefined as any,
      data: {
        number_of_shares: 1,
        offer: {
          price_per_share: 5,
          total_shares: 10,
          subscribed_shares: 0,
          min_investment: 1,
        },
      },
      backendSchema: {},
      isLoading: false,
    });

    const composable = useInvestAmountForm(props, emit);

    // change model to trigger watcher
    composable.model.number_of_shares = 3;
    await nextTick();

    // last call payload
    const lastCall = emit.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('update:modelValue');
    expect(lastCall?.[1]).toEqual({ number_of_shares: 3 });
  });

  it('marks form as invalid and disables button after validate when model is empty', async () => {
    const emit = vi.fn();

    const propsInvalid = reactive({
      modelValue: undefined as any,
      errorData: undefined as any,
      data: {
        number_of_shares: undefined,
        offer: {
          price_per_share: 10,
          total_shares: 10,
          subscribed_shares: 0,
          min_investment: 1,
        },
      },
      backendSchema: {},
      isLoading: false,
    });

    const invalidComposable = useInvestAmountForm(propsInvalid, emit);

    // trigger validation on empty/invalid model
    invalidComposable.onValidate();
    await nextTick();

    expect(invalidComposable.isValid.value).toBe(false);
    expect(invalidComposable.isBtnDisabled.value).toBe(true);
  });
});


