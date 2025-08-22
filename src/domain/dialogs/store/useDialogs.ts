import { ref } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

export const useDialogs = defineStore('dialogs', () => {
  const isDialogLogoutOpen = ref(false);

  const isDialogRefreshSessionOpen = ref(false);
  
  // Add event emitter for successful authentication
  const onSessionRefreshed = ref<(() => void) | null>(null);
  
  // Promise resolver for session refresh completion
  const sessionRefreshResolver = ref<((value: boolean) => void) | null>(null);
  
  const showRefreshSession = (): Promise<boolean> => {
    isDialogRefreshSessionOpen.value = true;
    
    return new Promise<boolean>((resolve) => {
      sessionRefreshResolver.value = resolve;
    });
  };

  const completeSessionRefresh = (success: boolean = true) => {
    if (sessionRefreshResolver.value) {
      sessionRefreshResolver.value(success);
      sessionRefreshResolver.value = null;
    }
    isDialogRefreshSessionOpen.value = false;
  };

  return {
    isDialogLogoutOpen,
    isDialogRefreshSessionOpen,
    showRefreshSession,
    completeSessionRefresh,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogs, useDialogs));
}
