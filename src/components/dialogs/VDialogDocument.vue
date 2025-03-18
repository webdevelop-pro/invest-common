<script setup lang="ts">
import { onMounted, onBeforeUnmount, nextTick } from 'vue';

import {
  VDialogContent, VDialog,
} from 'UiKit/components/Base/VDialog';

const props = defineProps({
  signUrl: {
    type: String,
    required: true,
  },
  open: {
    type: Function,
    required: true,
  },
  close: {
    type: Function,
    required: true,
  },
});
const openValue = defineModel<boolean>();

onMounted(() => {
  void nextTick(() => {
    props.open(props.signUrl, 'e-sign');
  });
});

onBeforeUnmount(() => {
  props.close();
});
</script>

<template>
  <VDialog v-model:open="openValue">
    <VDialogContent
      :aria-describedby="undefined"
      full-screen
      data-testid="document-modal"
      class="v-dialog-document"
    >
      <div
        id="e-sign"
        class="v-dialog-document__sign"
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
}
</style>
