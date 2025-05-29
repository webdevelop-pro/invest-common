<script setup lang="ts">
import { formatToDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { PropType, computed, ref } from 'vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import arrowRight from 'UiKit/assets/images/arrow-right.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { IFormattedNotification } from 'InvestCommon/data/notifications/notifications.formatter';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const notificationsStore = useNotifications();

const routerRef = ref<any>(null);

const props = defineProps({
  data: Object as PropType<IFormattedNotification>,
  search: String,
  external: Boolean, // is the component external and nee links instead of router
  loading: Boolean,
});

const isExternalLink = computed(() => {
  if (props.external) return true;

  // If buttonHref starts with "http" it's definitely an external URL
  return typeof props.data?.buttonTo === 'string' && props.data?.buttonTo?.startsWith('http');
});

const onMarkAsRead = () => {
  notificationsStore.markAsReadById(props.data?.id);
};
if (!isExternalLink.value) {
  try {
    const { useRouter } = await import('vue-router');
    routerRef.value = useRouter();
  } catch (e) {
    console.warn('vue-router not available:', e);
  }
}
const onButtonClick = async () => {
  await onMarkAsRead();
  notificationsStore.onSidebarToggle(false);

  if (!isExternalLink.value) {
    routerRef.value?.push(props.data?.buttonTo);
  } else {
    window.location.href = props.data?.buttonHref;
  }
};

const onMessageClick = () => {
  notificationsStore.onSidebarToggle(false);
};
</script>
<template>
  <VTableRow
    class="VTableNotificationItem v-table-notification-item"
    :class="{ 'is--unread': data?.isUnread }"
  >
    <VTableCell :class="{ 'v-table-notification-item__badge-loading': loading }">
      <VSkeleton
        v-if="loading"
        height="34px"
        width="86px"
      />
      <VBadge
        v-else
        :key="data?.tagText"
        v-highlight="search"
        :color="data?.tagBackground"
      >
        <span class="v-table-notification-item__tag-text">
          {{ data?.tagText }}
        </span>
      </VBadge>
    </VTableCell>
    <VTableCell :class="{ 'v-table-notification-item__text-loading': loading }">
      <div class="v-table-notification-item__content-wrap">
        <div v-if="loading">
          <VSkeleton
            height="21px"
            width="100px"
            class="v-table-notification-item__date is--h6__title"
          />
          <VSkeleton
            height="25px"
            width="200px"
            class="v-table-notification-item__content is--body"
          />
        </div>
        <div v-else>
          <span
            v-if="data?.created_at"
            :key="data?.created_at"
            class="v-table-notification-item__date is--h6__title"
          >
            {{ formatToDate(new Date(data?.created_at).toISOString(), true) }}
          </span>
          <p
            :key="data?.content"
            v-highlight="search"
            class="v-table-notification-item__content is--body"
            @click="onMessageClick"
            v-html="data?.content"
          />
        </div>

        <VSkeleton
          v-if="loading"
          height="32px"
          width="143px"
        />
        <VButton
          v-else
          :key="data?.buttonText"
          size="small"
          variant="link"
          class="v-table-notification-item__button"
          @click.prevent="onButtonClick"
        >
          {{ data?.buttonText }}
          <arrowRight
            class="v-table-notification-item__icon"
            alt="modal layout close icon"
          />
        </VButton>
      </div>
      <span
        v-if="data?.isUnread"
        class="v-table-notification-item__dot"
        @click.stop="onMarkAsRead"
      />
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
.v-table-notification-item {
  display: table-row;

  &.is--unread .v-table-cell {
    background-color: $gray-10;
    position: relative;
  }

  &__date {
    color: $gray-70;
    margin-bottom: 8px;
    display: block;
  }

  &__content {
    color: $gray-80;

    a {
      font-weight: 700;
      font-size: 16px;
      line-height: 26px;
      text-decoration: underline;
      transition: 0.3s all  ease-in-out;
      color: $primary;
      cursor: pointer;
      &:hover {
        text-decoration: none;
      }
    }
  }

  &__type {
    display: flex;
    flex-shrink: 0;
    width: 100%;
  }

  &__tag-text {
    text-transform: capitalize;
    white-space: nowrap;
  }

  &__content-wrap {
    display: flex;
    align-items: center;
    gap: 32px;
    justify-content: space-between;
    height: 100%;

    @media screen and (max-width: $tablet){
      flex-direction: column;
      min-width: 300px;
    }
  }

  &__dot {
    position: absolute;
    right: 8px;
    top: 8px;
    width: 6px;
    height: 6px;
    background-color: $primary;
    border-radius: 100%;
    z-index: 0;
    cursor: pointer;
  }

  &__button {
    flex-shrink: 0;

    @media screen and (max-width: $tablet){
      align-self: flex-start;
    }
  }

  &__icon {
    width: 16px;
  }

  &__text-loading {
    width: calc(100% - 150px);
  }

  &__badge-loading {
    width: 150px;
  }
}

.v-skeleton {
  transition: opacity 0.3s ease-in-out;
}
</style>
