<script setup lang="ts">
import ContactUsForm from 'InvestCommon/components/forms/VFormContactUs.vue';
import {
  VDialogContent, VDialogHeader, VDialogTitle, VDialog,
} from 'UiKit/components/Base/VDialog';
import { watch } from 'vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';
import { storeToRefs } from 'pinia';

const useDialogsStore = useDialogs();
const { isDialogContactUsOpen } = storeToRefs(useDialogsStore);

const open = defineModel<boolean>();

watch(() => open.value, () => {
  if (!open.value) {
    isDialogContactUsOpen.value = false;
  }
});
</script>

<template>
  <VDialog v-model:open="open">
    <VDialogContent
      :aria-describedby="undefined"
      class="v-dialog-contact-us"
    >
      <VDialogHeader>
        <VDialogTitle>
          Contact Us
        </VDialogTitle>
      </VDialogHeader>
      <ContactUsForm
        is-in-dialog
        class="is--margin-top-40"
        @close="open = false"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-contact-us {
  text-align: center;
}
</style>
