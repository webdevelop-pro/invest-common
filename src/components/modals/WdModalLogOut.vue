<template>
  <VModalLayout
    title="Log Out"
    class="wd-modal-log-out is--no-margin"
    @close="$emit('close')"
  >
    <template #default>
      <div class="wd-modal-log-out__img">
        <img
          :src="!EXTERNAL ? image : '/images/logout-modal.svg'"
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
        <VButton
          size="large"
          color="secondary"
          data-testid="cancel-button"
          @click="$emit('close')"
        >
          Cancel
        </VButton>
        <VButton
          size="large"
          color="danger"
          data-testid="logout-button"
          :loading="isLoadingLogout"
          :disabled="isLoadingLogout"
          @click="logoutHandler"
        >
          Log Out
        </VButton>
      </div>
    </template>
  </VModalLayout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import VModalLayout from 'UiKit/components/VModal/VModalLayout.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/global/index';
import image from 'InvestCommon/assets/images/icons/logout-modal.svg?url';

export default defineComponent({
  name: 'WdModalLogOut',
  components: {
    VModalLayout,
    VButton,
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
    const { EXTERNAL } = env;

    return {
      logoutHandler,
      EXTERNAL,
      isLoadingLogout,
      image,
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
