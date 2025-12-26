<script setup lang="ts">
import { computed } from 'vue';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import { storeToRefs } from 'pinia';

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

const notificationsStore = useNotifications();
const { notificationUnreadLength } = storeToRefs(notificationsStore);

const displayCount = computed(() => props.count ?? notificationUnreadLength.value);
const shouldShow = computed(() => displayCount.value > 0);

const badgeClasses = computed(() => [
  'notification-number',
  `notification-number--${props.position}`,
  props.customClass,
]);
</script>

<template>
  <span
    v-if="shouldShow"
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
}
</style>

