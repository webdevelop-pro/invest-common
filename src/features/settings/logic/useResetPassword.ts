import { ref, computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { JSONSchemaType } from 'ajv/dist/types/json-schema';
import { FormModelResetPassword } from 'InvestCommon/types/form';
import { useProfilesStore } from 'InvestCommon/domain/profiles/store/useProfiles';
import { useRepositorySettings } from 'InvestCommon/data/settings/settings.repository';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { ROUTE_SETTINGS_MFA } from 'InvestCommon/helpers/enums/routes';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { urlSettings } from 'InvestCommon/global/links';
import { scrollToError } from 'UiKit/helpers/validation/general';
import { errorMessageRule, passwordRule } from 'UiKit/helpers/validation/rules';
import { SELFSERVICE } from 'InvestCommon/features/settings/utils';

export function useResetPassword() {
  useGlobalLoader().hide();

  const profilesStore = useProfilesStore();
  const { selectedUserProfileId } = storeToRefs(profilesStore);
  const settingsRepository = useRepositorySettings();
  const { flowId, csrfToken, setSettingsState, getAuthFlowState } = storeToRefs(settingsRepository);

  const { toast } = useToast();
  const router = useRouter();

  const errorData = computed(() => (setSettingsState.value.error?.data?.responseJson));

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    definitions: {
      Auth: {
        properties: {
          create_password: passwordRule,
          repeat_password: {
            const: {
              $data: '1/create_password',
            },
            ...passwordRule,
            errorMessage: {
              const: 'Passwords do not match',
            },
          },
        },
        type: 'object',
        required: ['create_password', 'repeat_password'],
        errorMessage: errorMessageRule,
      },
    },
    $ref: '#/definitions/Auth',
  } as unknown as JSONSchemaType<FormModelResetPassword>;

  const {
    model,
    validation,
    isValid,
    onValidate,
  } = useFormValidation(schema, undefined, {} as FormModelResetPassword);

  const isLoading = ref(false);
  const isDisabledButton = computed(() => (!isValid.value || isLoading.value));

  const resetHandler = async () => {
    onValidate();
    if (!isValid.value) {
      nextTick(() => scrollToError('VFormResetPassword'));
      return;
    }

    isLoading.value = true;
    try {
      await settingsRepository.getAuthFlow(SELFSERVICE.settings);
      
      if (getAuthFlowState.value.error) {
        isLoading.value = false;
        return;
      }

      await settingsRepository.setSettings(flowId.value, {
        password: model.create_password,
        method: 'password',
        csrf_token: csrfToken.value,
      }, resetHandler); // Pass resetHandler as callback for retry after session refresh

      if (!setSettingsState.value.error) {
        toast({
          title: 'Submitted',
          description: 'Password reset success',
          variant: 'success',
        });
        router.push({ 
          name: ROUTE_SETTINGS_MFA, 
          params: { profileId: selectedUserProfileId.value } 
        });
      }
    } catch (error) {
      console.error('Recovery failed:', error);
    } finally {
      isLoading.value = false;
    }
  };

  const backButtonUrl = computed(() => urlSettings(selectedUserProfileId.value));

  return {
    // State
    isLoading,
    isValid,
    isDisabledButton,
    errorData,
    
    // Form
    model,
    validation,
    schema,
    
    // Methods
    resetHandler,
    onValidate,
    
    // Computed
    backButtonUrl,
    
    // Store references for template access
    setSettingsState,
    selectedUserProfileId,
  };
}
