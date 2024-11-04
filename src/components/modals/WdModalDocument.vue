<template>
  <BaseModalLayout
    full-screen
    class="wd-modal-document is--no-margin"
    data-testid="document-modal"
    @close="$emit('close')"
  >
    <template #default>
      <div
        id="e-sign"
        class="wd-modal-document__sign"
      />
    </template>
  </BaseModalLayout>
</template>

<script lang="ts">
import {
  defineComponent, onMounted, onBeforeUnmount,
} from 'vue';

import BaseModalLayout from 'UiKit/components/BaseModal/BaseModalLayout.vue';

export default defineComponent({
  name: 'WdModalDocument',
  components: {
    BaseModalLayout,
  },
  props: {
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
  },
  emits: ['close'], // close modal
  setup(props) {
    onMounted(() => {
      props.open(props.signUrl, 'e-sign');
    });

    onBeforeUnmount(() => {
      props.close();
    });
  },
});
</script>

<style lang="scss" scoped>
.wd-modal-document {
  width: 100%;
  height: 100%;

  &__sign {
    height: 100%;
    padding: 0 26px;
  }
}
</style>
