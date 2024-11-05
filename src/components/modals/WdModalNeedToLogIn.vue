<template>
  <BaseModalLayout
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
        <BaseButton
          size="large"
          @click="onClick"
        >
          Create an account
        </BaseButton>
      </div>
    </template>
  </BaseModalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import BaseModalLayout from 'UiKit/components/BaseModal/BaseModalLayout.vue';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import { useRouter } from 'vue-router';
import { ROUTE_LOGIN } from 'InvestCommon/helpers/enums/routes';

export default defineComponent({
  name: 'WdModalLogOut',
  components: {
    BaseModalLayout,
    BaseButton,
  },
  emits: ['close'], // close modal
  setup(_, ctx) {
    const router = useRouter();

    const onClick = () => {
      void router.push({ name: ROUTE_LOGIN, query: { redirect: router.currentRoute.value.fullPath } });
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
