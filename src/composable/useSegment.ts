import { acceptHMRUpdate, defineStore } from 'pinia';

export const useSegment = defineStore('segment', () => {
  const analyticsTrack = (event: string, options?: object) => {
    analytics.track(event, options);
  };

  const analyticsPage = (name: string, options?: object) => {
    analytics.page(name, options);
  };

  return {
    analyticsPage,
    analyticsTrack,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSegment, import.meta.hot));
}
