import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useFormValidation } from 'UiKit/helpers/validation/useFormValidation';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { errorMessageRule, typeProfileRule } from 'UiKit/helpers/validation/rules';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';
import { PROFILE_TYPES } from 'InvestCommon/domain/config/enums/profileTypes';

const selectTypes = [
  {
    value: PROFILE_TYPES.ENTITY,
    text: 'Entity',
  },
  {
    value: PROFILE_TYPES.TRUST,
    text: 'Trust',
  },
  {
    value: PROFILE_TYPES.SDIRA,
    text: 'Self-Directed IRA',
  },
  {
    value: PROFILE_TYPES.SOLO401K,
    text: 'Solo 401K',
  },
];

export const useVFormProfileSelectType = () => {
  const userProfileStore = useProfilesStore();
  const { selectedUserProfileData } = storeToRefs(userProfileStore);
  const useRepositoryProfilesStore = useRepositoryProfiles();
  const { setProfileByIdState, getProfileByIdOptionsState } = storeToRefs(useRepositoryProfilesStore);

  const SELECT_PROFILE_TYPES = computed(() => selectTypes);

  interface FormModelCreateProfileSelectType {
    type_profile: string;
  }
  const schemaFrontend = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Individual: {
        properties: {
          type_profile: typeProfileRule,
        },
        type: 'object',
        errorMessage: errorMessageRule,
        required: ['type_profile'],
      },
    },
    $ref: '#/definitions/Individual',
  } as unknown as JSONSchemaType<FormModelCreateProfileSelectType>;

  const modelData = computed(() => selectedUserProfileData?.value?.data);
  const schemaBackend = computed(() => getProfileByIdOptionsState.value.data);
  const errorData = computed(() => setProfileByIdState.value.error?.data?.responseJson);

  const fieldsPaths = ['type_profile'];

  const {
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
  } = useFormValidation<FormModelCreateProfileSelectType>(
    schemaFrontend,
    schemaBackend,
    { type_profile: '' } as FormModelCreateProfileSelectType,
    fieldsPaths,
  );

  return {
    modelData,
    schemaBackend,
    schemaFrontend,
    errorData,
    SELECT_PROFILE_TYPES,
    model,
    validation,
    isValid,
    onValidate,
    isFieldRequired,
    getErrorText,
  };
};
