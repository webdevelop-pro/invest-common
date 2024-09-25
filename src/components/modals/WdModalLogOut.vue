<template>
  <BaseModalLayout
    title="Log Out"
    class="wd-modal-log-out"
    @close="$emit('close')"
  >
    <template #default>
      <div class="wd-modal-log-out__img">
        <img
          src="InvestCommon/assets/images/icons/logout-modal.svg?url"
          alt=""
        >
      </div>
      <p
        class="wd-modal-log-out__text"
        data-testid="disconnect-modal-text"
      >
        Are you sure you want to log out?
      </p>
    </template>

    <template #footer>
      <div class="wd-modal-log-out__footer-btns">
        <BaseButton
          size="large"
          color="secondary"
          data-testid="cancel-button"
          @click="$emit('close')"
        >
          Cancel
        </BaseButton>
        <BaseButton
          size="large"
          color="danger"
          data-testid="logout-button"
          :loading="isLoadingLogout"
          :disabled="isLoadingLogout"
          @click="logoutHandler"
        >
          Log Out
        </BaseButton>
      </div>
    </template>
  </BaseModalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAuthLogicStore, useAuthStore } from 'InvestCommon/store';

import BaseModalLayout from 'UiKit/components/BaseModal/BaseModalLayout.vue';
import BaseButton from 'UiKit/components/BaseButton/BaseButton.vue';
import { storeToRefs } from 'pinia';

export default defineComponent({
  name: 'WdModalLogOut',
  components: {
    BaseModalLayout,
    BaseButton,
  },
  emits: ['close'], // close modal
  setup(_, ctx) {
    const authLogicStore = useAuthLogicStore();
    const { isLoadingLogout } = storeToRefs(authLogicStore);
    const authStore = useAuthStore();
    const { getLogoutResponse } = storeToRefs(authStore);

    const logoutHandler = async () => {
      await authLogicStore.onLogout();
      ctx.emit('close', getLogoutResponse.value);
    };

    return {
      logoutHandler,
      isLoadingLogout,
    };
  },
});
</script>

<style lang="scss">
.wd-modal-log-out {
  text-align: center;
  padding-top: 20px;

  @include media-lt(tablet) {
    display: flex;
    flex-direction: column;
  }

  &__img {
    max-width: 190px;
    max-height: 190px;
    margin: 25px auto;

    @include media-lt(tablet) {
      margin-top: 30px;
    }
  }

  &__text {
    margin: 0 0 20px;
    font-size: 17px;
    font-weight: 400;
    word-spacing: 0;

    @include media-lt(tablet) {
      width: 100%;
      max-width: 365px;
      margin: 0 auto 20px;
      line-height: 26px;
    }
  }

  &__footer-btns {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;

    @include media-lt(tablet) {
      flex: 1;
      flex-direction: column-reverse;
      align-items: center;
      justify-content: flex-start;
    }

    button {
      width: 210px;

      @include media-lt(tablet) {
        width: 100%;
        max-width: 341px;
        margin-top: 15px;
      }
    }
  }
}
</style>
