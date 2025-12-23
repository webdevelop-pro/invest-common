import { describe, it, expect, vi } from 'vitest';
import { reactive, nextTick } from 'vue';

import { useInvesOwnershipForm } from '../useInvestOwnershipForm';

describe('useInvesOwnershipForm', () => {
  it('initializes schemaFrontend and exposes validation helpers', () => {
    const emit = vi.fn();

    const props = reactive({
      modelValue: undefined as any,
      errorData: undefined as any,
      data: {
        profile_id: 10,
      },
      backendSchema: {},
      isLoading: false,
    });

    const composable = useInvesOwnershipForm(props, emit);

    expect(composable.schemaFrontend.value).toBeTruthy();
    expect(composable.formErrors).toBeDefined();
    expect(typeof composable.getErrorText).toBe('function');
  });

  it('syncs model.profile_id from props.data and emits updates', async () => {
    const emit = vi.fn();

    const props = reactive({
      modelValue: { number_of_shares: 1 } as any,
      errorData: undefined as any,
      data: {
        profile_id: 5,
      },
      backendSchema: {},
      isLoading: false,
    });

    const composable = useInvesOwnershipForm(props, emit);

    // immediate watcher from props.data.profile_id
    await nextTick();
    expect(composable.model.profile_id).toBe(5);

    composable.model.profile_id = 7;
    await nextTick();

    const lastCall = emit.mock.calls.at(-1);
    expect(lastCall?.[0]).toBe('update:modelValue');
    expect(lastCall?.[1]).toEqual({ number_of_shares: 1, profile_id: 7 });
  });

  it('updates model when external modelValue changes', () => {
    const emit = vi.fn();

    const props = reactive({
      modelValue: { profile_id: 1 },
      errorData: undefined as any,
      data: {},
      backendSchema: {},
      isLoading: false,
    });

    const composable = useInvesOwnershipForm(props, emit);
    expect(composable.model.profile_id).toBe(1);
  });
});


