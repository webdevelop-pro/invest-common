<script setup lang="ts">
import {
  VDialogContent, VDialog,
} from 'UiKit/components/Base/VDialog';

defineProps({
  signUrl: {
    type: String,
    required: true,
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const openValue = defineModel<boolean>();
</script>

<template>
  <VDialog
    v-model:open="openValue"
    query-key="popup"
    query-value="documents"
  >
    <VDialogContent
      :aria-describedby="undefined"
      full-screen
      class="v-dialog-document"
    >
      <iframe
        v-if="signUrl"
        :src="signUrl"
        class="v-dialog-document__iframe"
        frameborder="0"
        title="Document"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-dialog-document {
  width: 100%;
  height: 100%;

  &__sign {
    height: 100%;
    padding: 0 26px;

    @media screen and (max-width: $tablet){
      padding: 0;
    }
  }

  &__iframe {
    width: 100%;
    height: 100%;
  }
}
</style>
