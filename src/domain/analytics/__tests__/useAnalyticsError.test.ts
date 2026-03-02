import { describe, it } from 'vitest';
import {
  resolveComponentNameFromStack,
  resolveComponentNameFromAPIError,
  resolveComponentNameForAPIError,
  analyzeAPIErrorStack,
} from '../useAnalyticsError';

describe('useAnalyticsError stack analysis helpers', () => {
  it('run without throwing on representative stacks', () => {
    const stacks = [
      `Error: API request failed
      at UserProfile.vue:45:12
      at mounted (UserProfile.vue:23:8)
      at callWithErrorHandling (vue.js:1234:56)`,
      `Error: Failed to fetch data
      at AuthRepository.getSession (auth.repository.ts:67:15)
      at useAuthStore.login (auth.store.ts:45:23)
      at LoginForm.handleSubmit (LoginForm.vue:89:12)`,
    ];

    stacks.forEach((stack) => {
      const error = { message: 'Test error', stack } as Error;

      resolveComponentNameFromStack(stack);
      resolveComponentNameFromAPIError(error);
      analyzeAPIErrorStack(error);
      resolveComponentNameForAPIError(error, null);
    });
  });
});

