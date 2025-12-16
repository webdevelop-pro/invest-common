import { describe, it, expect } from 'vitest';
import { reactive } from 'vue';

import { useInvestSignatureForm } from '../useInvestSignatureForm';

describe('useInvestSignatureForm', () => {
  it('initializes dialog state and checkboxes as false', () => {
    const props = reactive({
      signId: null,
      isLoading: false,
      signUrl: '',
    });

    const composable = useInvestSignatureForm(props);

    expect(composable.state.value.isDialogDocumentOpen).toBe(false);
    expect(composable.state.value.checkbox1).toBe(false);
    expect(composable.state.value.checkbox2).toBe(false);
    expect(composable.canContinue.value).toBe(false);
    expect(composable.isValid.value).toBe(false);
    expect(composable.isBtnDisabled.value).toBe(true);
  });

  it('computes canContinue only when both checkboxes checked and signId provided', () => {
    const props = reactive({
      signId: '123',
      isLoading: false,
      signUrl: '',
    });

    const composable = useInvestSignatureForm(props);

    expect(composable.canContinue.value).toBe(false);

    composable.state.value.checkbox1 = true;
    composable.state.value.checkbox2 = true;

    expect(composable.canContinue.value).toBe(true);
    expect(composable.isValid.value).toBe(true);
    expect(composable.isBtnDisabled.value).toBe(false);
  });

  it('computes isSigned from signId', () => {
    const propsUnsigned = reactive({
      signId: null as any,
      isLoading: false,
      signUrl: '',
    });
    const unsigned = useInvestSignatureForm(propsUnsigned);
    expect(unsigned.isSigned.value).toBe(false);

    const propsSigned = reactive({
      signId: '123',
      isLoading: false,
      signUrl: '',
    });
    const signed = useInvestSignatureForm(propsSigned);
    expect(signed.isSigned.value).toBe(true);
  });

  it('exposes validation interface methods', () => {
    const props = reactive({
      signId: null,
      isLoading: false,
      signUrl: '',
    });

    const composable = useInvestSignatureForm(props);

    expect(typeof composable.onValidate).toBe('function');
    expect(typeof composable.scrollToError).toBe('function');
  });
});


