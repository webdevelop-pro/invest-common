<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryNotifications } from 'InvestCommon/data/notifications/notifications.repository';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

defineOptions({ name: 'VNotificationBadge' });

const props = withDefaults(defineProps<{
  /**
   * Custom count to display (overrides store value)
   */
  count?: number;
  /**
   * Position variant: 'absolute' for overlaying on icons, 'inline' for inline display
   */
  position?: 'absolute' | 'inline';
  /**
   * Custom class for additional styling
   */
  customClass?: string;
}>(), {
  position: 'inline',
});

const sessionStore = useSessionStore();
const { userLoggedIn } = storeToRefs(sessionStore);

const notificationsRepository = useRepositoryNotifications();
const { unreadNotificationsCount, getAllState } = storeToRefs(notificationsRepository);

const hasResolvedNotifications = computed(() => (
  getAllState.value?.data !== undefined || Boolean(getAllState.value?.error)
));

onMounted(() => {
  if (!userLoggedIn.value) {
    return;
  }

  const isLoading = Boolean(getAllState.value?.loading);

  if (!hasResolvedNotifications.value && !isLoading) {
    notificationsRepository.getAll();
  }
});

const displayCount = computed(() => props.count ?? unreadNotificationsCount.value);
const shouldShowLoading = computed(() => (
  props.count === undefined
  && userLoggedIn.value
  && !hasResolvedNotifications.value
));
const shouldShow = computed(() => !shouldShowLoading.value && displayCount.value > 0);

const badgeClasses = computed(() => [
  'notification-number',
  `notification-number--${props.position}`,
  props.customClass,
]);
</script>

<template>
  <VSkeleton
    v-if="shouldShowLoading"
    width="18px"
    height="18px"
    radius="9px"
    class="notification-number notification-number--loading"
    :class="badgeClasses"
    aria-hidden="true"
  />
  <span
    v-else-if="shouldShow"
    :class="badgeClasses"
    aria-label="Unread notifications"
  >
    {{ displayCount > 99 ? '99+' : displayCount }}
  </span>
</template>

<style lang="scss">
@use 'UiKit/styles/_colors.scss' as colors;

.notification-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: colors.$red;
  color: colors.$white;
  border-radius: 9px;
  font-weight: 700;
  font-size: 11px;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgb(0 0 0 / 15%);
  border: 2px solid colors.$white;
  z-index: 10;
  box-sizing: border-box;
  flex-shrink: 0;
  user-select: none;
  pointer-events: none;

  // Ensure proper display for single and double digit numbers
  &::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 11px;
    vertical-align: middle;
  }

  // Position variants
  &--absolute {
    position: absolute;
  }

  &--inline {
    display: inline-flex;
  }

  &--loading {
    border: 2px solid colors.$white;
    box-shadow: 0 2px 4px rgb(0 0 0 / 15%);
    pointer-events: none;
  }
}
</style>
