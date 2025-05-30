<script setup lang="ts">
import { useAuthLogicStore } from 'InvestCommon/store/useAuthLogic';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { storeToRefs } from 'pinia';
import env from 'InvestCommon/global/index';
import image from 'InvestCommon/assets/images/icons/logout-modal.svg?url';
import {
  VDialogContent, VDialogFooter, VDialogHeader, VDialogTitle, VDialog,
} from 'UiKit/components/Base/VDialog';
import VImage from 'UiKit/components/Base/VImage/VImage.vue';
import { watch } from 'vue';
import { useDialogs } from 'InvestCommon/store/useDialogs';

const useDialogsStore = useDialogs();
const { isDialogLogoutOpen } = storeToRefs(useDialogsStore);

const authLogicStore = useAuthLogicStore();
const { isLoadingLogout } = storeToRefs(authLogicStore);
const open = defineModel<boolean>();

const logoutHandler = async () => {
  await authLogicStore.onLogout();
  open.value = false;
};
const { IS_STATIC_SITE } = env;

watch(() => open.value, () => {
  if (!open.value) {
    isDialogLogoutOpen.value = false;
  }
});
</script>

<template>
  <VDialog
    v-model:open="open"
    query-key="popup"
    query-value="log-out"
  >
    <VDialogContent
      :aria-describedby="undefined"
      class="v-dialog-log-out"
    >
      <div>
        <VDialogHeader>
          <VDialogTitle>
            Log Out
          </VDialogTitle>
        </VDialogHeader>
        <div class="v-dialog-log-out__img">
          <VImage
            :src="!IS_STATIC_SITE ? image : '/images/logout-modal.svg'"
            alt=""
          />
        </div>
        <p
          class="v-dialog-log-out__text"
          data-testid="disconnect-modal-text"
        >
          Are you sure you want to log out?
        </p>
      </div>
      <VDialogFooter>
        <div class="v-dialog-log-out__footer-btns">
          <VButton
            size="large"
            variant="tetriary"
            data-testid="cancel-button"
            @click="open = false"
          >
            Cancel
          </VButton>
          <VButton
            size="large"
            color="red"
            data-testid="logout-button"
            :loading="isLoadingLogout"
            :disabled="isLoadingLogout"
            @click="logoutHandler"
          >
            Log Out
          </VButton>
        </div>
      </VDialogFooter>
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-log-out {
  text-align: center;
    @media screen and (max-width: $tablet){
      display: flex;
      flex-direction: column;
      justify-content: space-between;
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
    gap: 20px;

    @include media-lt(tablet) {
      flex-direction: column-reverse;
      align-items: stretch;
      justify-content: flex-start;
    }

    .v-button {
      flex-grow: 1;
    }
  }
}
</style>
