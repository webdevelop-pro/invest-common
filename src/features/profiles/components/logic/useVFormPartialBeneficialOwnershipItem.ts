import {
  computed, watch, Ref,
} from 'vue';

export interface FormPartialBeneficialOwnershipItem {
  first_name: string;
  last_name: string;
  dob: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  email: string;
  non_us: boolean;
  ssn?: string;
  type_of_identification?: {
    id_number: string;
    country: string;
  };
}

export const useVFormPartialBeneficialOwnershipItem = (
  model: Ref<FormPartialBeneficialOwnershipItem>,
  trust: boolean = false,
) => {
  watch(() => model.value?.non_us, () => {
    if (model.value?.non_us) {
      // eslint-disable-next-line no-param-reassign
      model.value.type_of_identification = { id_number: '', country: '' };
    } else {
      // eslint-disable-next-line no-param-reassign
      delete model.value?.type_of_identification;
    }
  });

  const title = computed(() => (trust ? 'Trustee or Protector' : 'Beneficial Owner'));

  return {
    model,
    title,
  };
};
