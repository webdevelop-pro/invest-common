/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

export const useDialogs = defineStore('dialogs', () => {
  const isDialogLogoutOpen = ref(false);

  const isDialogRefreshSessionOpen = ref(false);
  const showRefreshSession = () => {
    isDialogRefreshSessionOpen.value = true;
  };

  return {
    isDialogLogoutOpen,
    isDialogRefreshSessionOpen,
    showRefreshSession,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogs, import.meta.hot));
}
