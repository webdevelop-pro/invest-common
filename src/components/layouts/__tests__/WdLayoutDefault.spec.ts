import {
  Mock, vi, it, describe, expect, beforeEach, afterEach,
} from 'vitest';
import { render, screen } from '@testing-library/vue';
import { useRouter, Router } from 'vue-router';
import { useCore } from 'InvestCommon/store';
import WdLayoutDefault from '../WdLayoutDefault.vue';

vi.mock('vue-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const useRoute = vi.fn().mockReturnValue({ query: { error500: '1' } });
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const useRouter = vi.fn().mockReturnValue({ replace: vi.fn() });

  return {
    useRouter,
    useRoute,
  };
});

vi.mock('InvestCommon/store');

function renderComponent(props?: object) {
  const { container } = render(WdLayoutDefault, {
    props,
  });

  return {
    container,
  };
}

describe('WdLayoutDefault', () => {
  let router: Router;

  beforeEach(() => {
    router = useRouter();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title if server error is false', () => {
    (useCore as Mock).mockReturnValue({ person: { value: { isServerError: false } } });

    renderComponent({ title: 'Some title' });

    expect(screen.queryByText('Some title')).toBeTruthy();
  });

  it('should render 500 error component', () => {
    (useCore as Mock).mockReturnValue({ person: { value: { isServerError: true } } });

    renderComponent({ title: 'Some title' });

    expect(screen.queryByText('Some title')).toBeFalsy();
    expect(screen.queryByText('System Error')).toBeTruthy();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(router.replace).toHaveBeenCalledWith({ query: { error500: '1' } });
  });
});
