import { ref } from 'vue';

const needRefresh = ref(false);
const offlineReady = ref(false);
let shouldThrow = false;
let updateServiceWorker = async () => {};

export const __resetPwaRegisterMock = () => {
  needRefresh.value = false;
  offlineReady.value = false;
  shouldThrow = false;
  updateServiceWorker = async () => {};
};

export const __setPwaRegisterMockState = (next: {
  needRefresh?: boolean;
  offlineReady?: boolean;
  shouldThrow?: boolean;
  updateServiceWorker?: (reloadPage?: boolean) => Promise<void>;
}) => {
  if (typeof next.needRefresh === 'boolean') {
    needRefresh.value = next.needRefresh;
  }
  if (typeof next.offlineReady === 'boolean') {
    offlineReady.value = next.offlineReady;
  }
  if (typeof next.shouldThrow === 'boolean') {
    shouldThrow = next.shouldThrow;
  }
  if (next.updateServiceWorker) {
    updateServiceWorker = next.updateServiceWorker;
  }
};

export const useRegisterSW = () => {
  if (shouldThrow) {
    throw new Error('mock register failed');
  }

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
  };
};
