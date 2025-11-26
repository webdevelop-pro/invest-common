import { ref, watch } from 'vue';
import { acceptHMRUpdate, defineStore } from 'pinia';

export const useDialogs = defineStore('dialogs', () => {
  const isDialogLogoutOpen = ref(false);
  const isDialogRefreshSessionOpen = ref(false);
  const isDialogContactUsOpen = ref(false);
  const dialogContactUsSubject = ref<string | null>(null);
  
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

  const openContactUsDialog = (subject?: string) => {
    dialogContactUsSubject.value = subject ?? null;
    isDialogContactUsOpen.value = true;
  };

  const closeContactUsDialog = () => {
    isDialogContactUsOpen.value = false;
    dialogContactUsSubject.value = null;
  };

  watch(isDialogContactUsOpen, (isOpen) => {
    if (!isOpen) {
      dialogContactUsSubject.value = null;
    }
  });

  return {
    isDialogLogoutOpen,
    isDialogRefreshSessionOpen,
    isDialogContactUsOpen,
    dialogContactUsSubject,
    showRefreshSession,
    completeSessionRefresh,
    openContactUsDialog,
    closeContactUsDialog,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogs, useDialogs));
}
