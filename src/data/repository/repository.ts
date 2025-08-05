import { ref } from 'vue';

export type ActionState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
};

// Utility function to create action states
export const createActionState = <T>(defaultData?: T) => ref<ActionState<T>>({
  data: defaultData,
  loading: false,
  error: null,
});
