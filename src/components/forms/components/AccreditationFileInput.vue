<script setup lang="ts">
import {
  ref, computed, watch, reactive, nextTick,
} from 'vue';
import { useAccreditationStore } from 'InvestCommon/store/useAccreditation';
import VFormInput from 'UiKit/components/VForm/VFormInput.vue';
import VFormTextarea from 'UiKit/components/VForm/VFormTextarea.vue';
import VUploader from 'UiKit/components/VUploader/VUploader.vue';
import VFormGroup from 'UiKit/components/VForm/VFormGroup.vue';
import { descriptionFileRule, errorMessageRule, noteFileRule } from 'UiKit/helpers/validation/rules';
import { JSONSchemaType } from 'ajv';
import { isEmpty } from 'InvestCommon/helpers/general';
import { PrecompiledValidator } from 'UiKit/helpers/validation/PrecompiledValidator';
import { storeToRefs } from 'pinia';
import { FormModelAccreditationFileInput, TFields } from 'InvestCommon/types/form';

const emit = defineEmits(['files', 'model', 'valid']);

const props = defineProps({
  validate: Boolean,
});

const accreditationStore = useAccreditationStore();
const { uploadAccreditationDocumentErrorData } = storeToRefs(accreditationStore);

const filesUploadError = ref('');
const allFiles = ref<File[]>([]);

// const allFiles = computed(() => accreditation.value.getFiles);

const requiredValueSchema = computed(() => {
  const V = ['description1', 'note'] as string[];
  if (allFiles.value.length >= 2) V.push('description2');
  if (allFiles.value.length >= 3) V.push('description3');
  if (allFiles.value.length >= 4) V.push('description4');
  if (allFiles.value.length >= 5) V.push('description5');
  if (allFiles.value.length >= 6) V.push('description6');
  return V;
});


const schemaAccreditationFileInput = computed(() => ({
  $schema: 'http://json-schema.org/draft-07/schema#',
  definitions: {
    Individual: {
      properties: {
        description1: descriptionFileRule,
        description2: descriptionFileRule,
        description3: descriptionFileRule,
        description4: descriptionFileRule,
        description5: descriptionFileRule,
        description6: descriptionFileRule,
        note: noteFileRule,
      },
      type: 'object',
      required: requiredValueSchema.value,
      errorMessage: errorMessageRule,
    },
  },
  $ref: '#/definitions/Individual',
} as unknown as JSONSchemaType<FormModelAccreditationFileInput>));

const model = reactive({
} as FormModelAccreditationFileInput);

let validator = new PrecompiledValidator<FormModelAccreditationFileInput>(
  schemaAccreditationFileInput.value,
);
const validation = ref<unknown>();
const isValid = computed(() => isEmpty(validation.value || {}));


const onValidate = () => {
  validation.value = validator.getFormValidationErrors(model);
};


// const setDescriptions = () => {
//   if (accreditation.value.getDescriptions.length) {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     const { note, ...fields } = model;
//     accreditation.value.getDescriptions.forEach((key, index) => {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
//       model[`description${index + 1}`] = accreditation.value.getDescriptions[index];
//     });
//   }
// };

const onFileChange = (files: File[]) => {
  allFiles.value = files;
  emit('files', allFiles.value);
  void nextTick(() => {
    if (!isValid.value) onValidate();
  });
};

const onFileRemove = (index: number) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  if (model[`description${index + 1}`]) delete model[`description${index + 1}`];
};


const getErrorText = (index: number) => (
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  uploadAccreditationDocumentErrorData?.value ? uploadAccreditationDocumentErrorData?.value[`description${index}`] : undefined
);

watch(() => [isValid.value, filesUploadError.value], (value) => {
  const isInvalid = !value[0] || !!value[1];
  emit('valid', !isInvalid);
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-return
watch(() => model, () => {
  if (!isValid.value) onValidate();
  emit('model', model);
}, { deep: true });

watch(() => schemaAccreditationFileInput.value, () => {
  validator = new PrecompiledValidator<FormModelAccreditationFileInput>(
    schemaAccreditationFileInput.value,
  );
}, { deep: true, immediate: true });

watch(() => props.validate, () => {
  if (props.validate) {
    onValidate();
  }
}, { immediate: true });

// onMounted(() => {
//   setDescriptions();
// });
</script>

<template>
  <div class="AccreditationFileInput accreditation-file-input">
    <VFormGroup
      label="Upload Accreditation Documents"
      required
    >
      <VUploader
        class="accreditation-file-input__field"
        @update:files="onFileChange"
        @remove="onFileRemove"
      />
    </VFormGroup>

    <template v-if="allFiles && allFiles.length">
      <VFormGroup
        v-for="(file, index) in allFiles"
        :key="file.name"
        v-slot="VFormGroupProps"
        :model="model"
        :validation="validation"
        :schema-front="schemaAccreditationFileInput"
        :error-text="getErrorText(index + 1)"
        :path="`description${index + 1}`"
        :label="`To process your documents faster, please provide additional
          details or explanations related to ${file.name}`"
        class="accreditation-file-input__description"
      >
        <VFormInput
          :model-value="model[`description${index + 1}` as TFields]"
          :name="`description${index}`"
          :is-error="VFormGroupProps.isFieldError"
          data-testid="file-description"
          @update:model-value="model[`description${index + 1}` as TFields] = $event"
        />
      </VFormGroup>
      <VFormGroup
        v-slot="VFormGroupProps"
        class="accreditation-file-input__note"
        :model="model"
        :validation="validation"
        :schema-front="schemaAccreditationFileInput"
        :error-text="uploadAccreditationDocumentErrorData?.note"
        path="note"
        label="To process your request faster, please describe your situation,
          write down all important details we should know about"
      >
        <VFormTextarea
          :model-value="model.note"
          rows="3"
          :is-error="VFormGroupProps.isFieldError"
          @update:model-value="model.note = $event"
        />
      </VFormGroup>
    </template>
  </div>
</template>

<style lang="scss">
.accreditation-file-input {

  &__field {
    margin-bottom: 30px;
  }

  &__note {
    margin-top: 32px;
  }

  &__name {
    display: block;
    padding: 10px 0;
    width: 100%;
    height: 48px;
    color: #757575;
    margin-right: 10px;
    font-size: 17px;
    line-height: 28px;
    font-weight: 400;
    border-bottom: 1px solid #9b9b9b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__description {
    margin-bottom: 20px;
  }
}
</style>
