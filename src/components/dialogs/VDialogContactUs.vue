<script setup lang="ts">
import ContactUsForm from 'InvestCommon/components/forms/VFormContactUs.vue';
import {
  VDialogContent, VDialogHeader, VDialogTitle, VDialog,
} from 'UiKit/components/Base/VDialog';

const open = defineModel<boolean>();

defineProps({
  subject: String,
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="popup"
    query-value="contact-us"
  >
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
        :subject="subject"
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
