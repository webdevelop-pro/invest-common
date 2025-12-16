import { describe, it, expect, vi } from 'vitest';
import { reactive, nextTick } from 'vue';

import { useInvestFundingAch } from '../useInvestFundingAch';

describe('useInvestFundingAch', () => {
  it('emits model without authorizeDebit and includes isInvalid flag', async () => {
    const emit = vi.fn();
    const props = reactive({
      modelValue: undefined as any,
      validate: false,
      errorData: undefined as any,
      paymentData: undefined as any,
    });

    const composable = useInvestFundingAch(props, emit);

    // change model to trigger emit
    composable.model.accountHolderName = 'John Doe';
    composable.model.authorizeDebit = true;
    await nextTick();

    const lastCall = emit.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('update:modelValue');
    // authorizeDebit should not be present
    expect(lastCall?.[1]).toMatchObject({
      accountHolderName: 'John Doe',
    });
    expect(lastCall?.[1]).toHaveProperty('isInvalid');
    expect(lastCall?.[1]).not.toHaveProperty('authorizeDebit');
  });

  it('populates model from paymentData', async () => {
    const emit = vi.fn();
    const props = reactive({
      modelValue: undefined as any,
      validate: false,
      errorData: undefined as any,
      paymentData: {
        account_holder_name: 'Jane Smith',
        account_number: '1234',
        routing_number: '5678',
        account_type: 'checking',
      },
    });

    const composable = useInvestFundingAch(props, emit);

    await nextTick();

    expect(composable.model.accountHolderName).toBe('Jane Smith');
    expect(composable.model.accountNumber).toBe('1234');
    expect(composable.model.routingNumber).toBe('5678');
    expect(composable.model.accountType).toBe('checking');
  });

  it('runs validation when validate becomes true', async () => {
    const emit = vi.fn();

    const props = reactive({
      modelValue: undefined as any,
      validate: false,
      errorData: undefined as any,
      paymentData: undefined as any,
    });

    const composable = useInvestFundingAch(props, emit);

    // toggle validate to true to trigger watcher
    props.validate = true;
    await nextTick();
    await nextTick();

    // with empty model, real validation should mark form as invalid
    expect(composable.isValid.value).toBe(false);
  });
});


