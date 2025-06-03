<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VFormInput from 'UiKit/components/Base/VForm/VFormInput.vue';
import VFormTextarea from 'UiKit/components/Base/VForm/VFormTextarea.vue';
import VUploader from 'UiKit/components/VUploader/VUploader.vue';
import VFormGroup from 'UiKit/components/Base/VForm/VFormGroup.vue';
import { useAccreditationUpload } from '../store/useAccreditationUpload';
import { TFields } from 'InvestCommon/types/form';

const props = defineProps({
  validate: Boolean,
});

const accreditationUploadStore = useAccreditationUpload();
const {
  model,
  allFiles,
  validation,
  schemaAccreditationFileInput,
  uploadAccreditationDocumentErrorData,
} = storeToRefs(accreditationUploadStore);

const { onFilesChange, onFileRemove } = accreditationUploadStore;
</script>

<template>
  <div class="VFormAccreditationFileInput v-form-accreditation-file-input">
    <VFormGroup
      label="Upload Accreditation Documents"
      required
    >
      <VUploader
        class="v-form-accreditation-file-input__field"
        @update:files="onFilesChange"
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
        :error-text="accreditationUploadStore.getErrorText(index + 1)"
        :path="`description${index + 1}`"
        :label="`To process your documents faster, please provide additional
          details or explanations related to ${file.name}`"
        class="v-form-accreditation-file-input__description"
      >
        <VFormInput
          :model-value="model[`description${index + 1}` as TFields]"
          :name="`description${index}`"
          :is-error="VFormGroupProps.isFieldError"
          data-testid="file-description"
          size="large"
          @update:model-value="model[`description${index + 1}` as TFields] = $event"
        />
      </VFormGroup>
      <VFormGroup
        v-slot="VFormGroupProps"
        class="v-form-accreditation-file-input__note"
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
.v-form-accreditation-file-input {

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
