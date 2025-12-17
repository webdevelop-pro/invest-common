import { computed, ref } from 'vue';
import { useForm } from 'UiKit/composables/useForm';

export interface UseInvestSignatureFormProps {
  signId?: string | number | null;
  isLoading?: boolean;
  signUrl?: string;
}

export function useInvestSignatureForm(
  props: UseInvestSignatureFormProps,
) {
  // Reactive state
  const state = ref({
    isDialogDocumentOpen: false,
    checkbox1: false,
    checkbox2: false,
  });
  // Computed properties
  const canContinue = computed(() => state.value.checkbox1
    && state.value.checkbox2
    && Boolean(props.signId));

  const isSigned = computed(() => Boolean(props.signId));

  // Align with other Invest form composables (e.g. amount, funding, ownership)
  const isValid = computed(() => canContinue.value);
  const isBtnDisabled = computed(() => !canContinue.value);

  // Signature form has no internal validation side-effects yet,
  // but we keep the same interface for the parent step.
  const onValidate = () => {};
  const scrollToError = () => {};

  // Track dirty state relative to initial unchecked state
  const { isDirty } = useForm<{ checkbox1: boolean; checkbox2: boolean }>({
    initialValues: { checkbox1: false, checkbox2: false },
    currentValues: state,
  });

  return {
    // Form state
    state,
    
    // Computed values
    canContinue,
    isSigned,
    isValid,
    isBtnDisabled,

    // Validation interface
    onValidate,
    scrollToError,

    // Dirty state
    isDirty,
  };
}
