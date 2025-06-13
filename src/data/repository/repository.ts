import { ref } from 'vue';

export type ActionState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
};

// Utility function to create action states
export const createActionState = <T>() => ref<ActionState<T>>({
  data: undefined,
  loading: false,
  error: null,
});
