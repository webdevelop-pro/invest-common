import { computed, nextTick } from 'vue';
import { scrollToError } from 'UiKit/helpers/validation/general';
import type { KycFormSections } from './useKycFormWorkflow';

export function useKycFormValidation(formSections: KycFormSections, scrollTargetClass = 'ViewKYC') {
  const isValid = computed(() => formSections.every((section) => section.value?.isValid));

  const validateSections = () => {
    formSections.forEach((section) => section.value?.onValidate());

    if (isValid.value) {
      return true;
    }

    nextTick(() => scrollToError(scrollTargetClass));
    return false;
  };

  return {
    isValid,
    validateSections,
  };
}
