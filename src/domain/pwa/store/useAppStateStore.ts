import { defineStore } from 'pinia';
import { installPwaNoZoomGuards } from '../disableZoom';
import { isPwaMobile } from '../pwaDetector';

export const useAppStateStore = defineStore('appState', {
  state: () => ({
    isPwa: false,
    isMobile: false,
  }),
  actions: {
    initializeAppState() {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
      }

      this.isMobile = isPwaMobile();
      if (this.isMobile) {
        this.isPwa = true;
        installPwaNoZoomGuards();
        document.body.classList.add('pwa-mobile');
      }
    },
  },
});