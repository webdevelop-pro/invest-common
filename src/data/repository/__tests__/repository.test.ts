import { describe, it, expect } from 'vitest';
import {
  createActionState,
  createRepositoryStates,
  withActionState,
  type ActionState,
} from '../repository';

describe('repository', () => {
  describe('createActionState', () => {
    it('creates ref with initial state when no default data', () => {
      const state = createActionState<{ id: number }>();

      expect(state.value).toEqual({
        data: undefined,
        loading: false,
        error: null,
      });
    });

    it('creates ref with default data when provided', () => {
      const defaultData = { id: 1, name: 'test' };
      const state = createActionState(defaultData);

      expect(state.value).toEqual({
        data: defaultData,
        loading: false,
        error: null,
      });
    });

    it('returns a reactive ref that can be updated', () => {
      const state = createActionState<string>();

      state.value = { data: 'updated', loading: true, error: null };

      expect(state.value.data).toBe('updated');
      expect(state.value.loading).toBe(true);
    });
  });

  describe('createRepositoryStates', () => {
    it('creates one ref per config key with correct initial state', () => {
      type States = { fetchItems: string[]; fetchOne: { id: number } | undefined };
      const { fetchItems, fetchOne } = createRepositoryStates<States>({
        fetchItems: undefined,
        fetchOne: { id: 42 },
      });

      expect(fetchItems.value).toEqual({
        data: undefined,
        loading: false,
        error: null,
      });
      expect(fetchOne.value).toEqual({
        data: { id: 42 },
        loading: false,
        error: null,
      });
    });

    it('resetAll sets every state to initial (no default data)', () => {
      type States = { a: number; b: string };
      const { a, b, resetAll } = createRepositoryStates<States>({ a: undefined, b: undefined });

      a.value = { data: 1, loading: true, error: new Error('x') };
      b.value = { data: 'y', loading: false, error: null };

      resetAll();

      expect(a.value).toEqual({ data: undefined, loading: false, error: null });
      expect(b.value).toEqual({ data: undefined, loading: false, error: null });
    });

    it('resetAll uses a new object per ref (no shared reference)', () => {
      type States = { x: number };
      const { x, resetAll } = createRepositoryStates<States>({ x: undefined });

      resetAll();
      const firstReset = x.value;
      x.value.loading = true; // mutate if it were shared, would affect next reset
      resetAll();
      const secondReset = x.value;

      expect(firstReset).not.toBe(secondReset);
      expect(secondReset.loading).toBe(false);
    });

    it('handles empty config', () => {
      const result = createRepositoryStates<Record<string, never>>({});

      expect(result.resetAll).toBeTypeOf('function');
      expect(() => result.resetAll()).not.toThrow();
    });
  });

  describe('withActionState', () => {
    it('sets loading true then updates to success state and returns result', async () => {
      const state = createActionState<{ id: number }>();

      const result = await withActionState(state, async () => ({ id: 99 }));

      expect(result).toEqual({ id: 99 });
      expect(state.value).toEqual({
        data: { id: 99 },
        loading: false,
        error: null,
      });
    });

    it('return value equals state.data after success', async () => {
      const state = createActionState<string>();
      const data = 'result';

      const returned = await withActionState(state, async () => data);

      expect(returned).toBe(data);
      expect(state.value.data).toBe(returned);
    });

    it('sets loading true then error state and rethrows on failure', async () => {
      const state = createActionState<number>();
      const err = new Error('fail');

      const promise = withActionState(state, async () => {
        throw err;
      });

      await expect(promise).rejects.toThrow('fail');
      expect(state.value).toEqual({
        data: undefined,
        loading: false,
        error: err,
      });
    });

    it('replaces state with new object on each update (immutable updates)', async () => {
      const state = createActionState<string>();
      let previousValue: ActionState<string | undefined> | null = null;

      await withActionState(state, async () => {
        previousValue = state.value;
        return 'done';
      });

      expect(previousValue).not.toBe(state.value);
      expect(state.value.data).toBe('done');
    });
  });
});
