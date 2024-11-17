<template>
  <VModalLayout
    class="wd-modal-log-out is--no-margin"
    @close="$emit('close')"
  >
    <template #default>
      <p
        class="wd-modal-log-out__text"
        data-testid="disconnect-modal-text"
      >
        Sorry, in order to see this picture you need to
      </p>
    </template>

    <template #footer>
      <div class="wd-modal-log-out__footer-btns">
        <VButton
          size="large"
          @click="onClick"
        >
          Create an account
        </VButton>
      </div>
    </template>
  </VModalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import VModalLayout from 'UiKit/components/VModal/VModalLayout.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { useRouter } from 'vue-router';
import { navigateWithQueryParams } from 'InvestCommon/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';

export default defineComponent({
  name: 'WdModalLogOut',
  components: {
    VModalLayout,
    VButton,
  },
  emits: ['close'], // close modal
  setup(_, ctx) {
    const router = useRouter();

    const onClick = () => {
      navigateWithQueryParams(urlSignin, { redirect: router.currentRoute.value.fullPath });
      ctx.emit('close');
    };

    return {
      onClick,
    };
  },
});
</script>

<style lang="scss">
.wd-modal-log-out {
  text-align: center;
  padding-top: 20px;

  &__footer-btns {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>
