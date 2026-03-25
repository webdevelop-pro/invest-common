import { computed, defineComponent, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VNotificationBadge from '../VNotificationBadge.vue';

const userLoggedIn = ref(true);
const formattedNotifications = ref<unknown[]>([]);
const unreadNotificationsCount = computed(() => formattedNotifications.value.length);
const getAllState = ref({
  data: undefined as unknown,
  loading: false,
  error: null as unknown,
});
const getAll = vi.fn(async () => []);

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');
  return {
    ...actual,
    storeToRefs: (store: Record<string, unknown>) => store,
  };
});

vi.mock('InvestCommon/domain/session/store/useSession', () => ({
  useSessionStore: () => ({
    userLoggedIn,
  }),
}));

vi.mock('InvestCommon/data/notifications/notifications.repository', () => ({
  useRepositoryNotifications: () => ({
    formattedNotifications,
    unreadNotificationsCount,
    getAllState,
    getAll,
  }),
}));

vi.mock('UiKit/components/Base/VSkeleton/VSkeleton.vue', () => ({
  default: defineComponent({
    name: 'VSkeleton',
    inheritAttrs: false,
    template: '<div class="v-skeleton-stub" v-bind="$attrs" />',
  }),
}));

describe('VNotificationBadge', () => {
  beforeEach(() => {
    userLoggedIn.value = true;
    formattedNotifications.value = [];
    getAllState.value = {
      data: undefined,
      loading: false,
      error: null,
    };
    getAll.mockClear();
  });

  it('shows a skeleton while unread notifications are still unknown', () => {
    const wrapper = mount(VNotificationBadge);

    expect(getAll).toHaveBeenCalledTimes(1);
    expect(wrapper.find('.notification-number--loading').exists()).toBe(true);
    expect(wrapper.find('[aria-label="Unread notifications"]').exists()).toBe(false);
  });

  it('hides the loading state after an error', () => {
    getAllState.value = {
      data: undefined,
      loading: false,
      error: new Error('failed'),
    };

    const wrapper = mount(VNotificationBadge);

    expect(getAll).not.toHaveBeenCalled();
    expect(wrapper.find('.notification-number--loading').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Unread notifications"]').exists()).toBe(false);
  });

  it('shows the unread badge after notifications resolve', () => {
    formattedNotifications.value = [{ id: 1 }, { id: 2 }];
    getAllState.value = {
      data: [],
      loading: false,
      error: null,
    };

    const wrapper = mount(VNotificationBadge);

    expect(wrapper.find('.notification-number--loading').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Unread notifications"]').text()).toBe('2');
  });
});
