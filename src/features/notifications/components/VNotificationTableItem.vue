<script setup lang="ts">
import { formatToDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { PropType, ref } from 'vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import arrowRight from 'UiKit/assets/images/arrow-right.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { IFormattedNotification } from 'InvestCommon/data/notifications/notifications.types';
import { useNotifications } from 'InvestCommon/features/notifications/store/useNotifications';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

const notificationsStore = useNotifications();

const isLoading = ref(false);

const props = defineProps({
  data: Object as PropType<IFormattedNotification>,
  search: String,
  isStaticSite: String, // is the component external and nee links instead of router
  loading: Boolean,
});

const onMarkAsRead = async () => {
  if (!props.data?.id) return;
  
  isLoading.value = true;
  await notificationsStore.markAsReadById(props.data.id);
  isLoading.value = false;
};

const onButtonClick = async () => {
  if (!props.data?.buttonHref) return;
  
  await onMarkAsRead();
  notificationsStore.onSidebarToggle(false);
  window.location.href = props.data.buttonHref;
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
    <VTableCell class="v-table-notification-item__badge-cell">
      <VSkeleton
        :is-loaded="!loading && !isLoading"
        height="34px"
        width="86px"
        radius="24px"
      >
        <VBadge
          :key="data?.tagText"
          v-highlight="search"
          :color="data?.tagBackground"
        >
          <span class="v-table-notification-item__tag-text">
            {{ data?.tagText }}
          </span>
        </VBadge>
      </VSkeleton>
    </VTableCell>
    <VTableCell class="v-table-notification-item__text-cell">
      <div class="v-table-notification-item__content-wrap">
        <div class="v-table-notification-item__text">
          <VSkeleton
            :is-loaded="!loading && !isLoading"
            height="21px"
            width="100px"
            class="v-table-notification-item__date is--h6__title"
          >
            <span
              v-if="data?.created_at"
              :key="data?.created_at"
              class="v-table-notification-item__date is--h6__title"
            >
              {{ formatToDate(new Date(data?.created_at).toISOString(), true) }}
            </span>
          </VSkeleton>

          <VSkeleton
            :is-loaded="!loading && !isLoading"
            height="25px"
            width="100%"
            class="v-table-notification-item__content is--body"
          >
            <p
              :key="data?.content"
              v-highlight="search"
              v-dompurify-html="data?.content"
              class="v-table-notification-item__content is--body"
              role="button"
              tabindex="0"
              :aria-label="`Click to view notification: ${data?.content || 'Notification'}`"
              @click="onMessageClick"
              @keydown.enter="onMessageClick"
              @keydown.space="onMessageClick"
            />
          </VSkeleton>
        </div>

        <VSkeleton
          :is-loaded="!loading && !isLoading"
          height="32px"
          width="143px"
        >
          <VButton
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
        </VSkeleton>
      </div>
      <span
        v-if="data?.isUnread"
        class="v-table-notification-item__dot"
        role="button"
        tabindex="0"
        aria-label="Mark notification as read"
        @click.stop="onMarkAsRead"
        @keydown.enter="onMarkAsRead"
        @keydown.space="onMarkAsRead"
      />
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;

.v-table-notification-item {
  @media screen and (width > $tablet){
    display: table-row;
  }

  @media screen and (width < $tablet){
    display: flex;
    flex-direction: column;
    position: relative;
  }

  &.is--unread .v-table-cell {
    background-color: $gray-10;

    @media screen and (width > $tablet){
      position: relative;
    }
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

    @media screen and (width < $tablet){
      align-self: flex-start;
      width: 100%;
    }
  }

  &__icon {
    width: 16px;
  }

  &__text-cell {
    @media screen and (width > $tablet){
      width: calc(100% - 160px);
    }

    @media screen and (width < $tablet){
      width: 100%;
    }
  }

  &__badge-cell {
    @media screen and (width > $tablet){
      width: 160px;
    }

    @media screen and (width < $tablet){
      width: 100%;
    }
  }

  &__text {
    width: 100%;
  }
}
</style>
