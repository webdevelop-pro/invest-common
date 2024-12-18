<script setup lang="ts">
import { INotification } from 'InvestCommon/types/api/notifications';
import { formatToDate } from 'InvestCommon/helpers/formatters/formatToDate';
import { PropType, computed } from 'vue';
import VTag from 'UiKit/components/VTag/VTag.vue';
import VButton from 'UiKit/components/VButton/VButton.vue';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { useNotificationsStore } from 'InvestCommon/store/useNotifications';
import {
  ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_ACCOUNT,
  ROUTE_DASHBOARD_WALLET, ROUTE_INVESTMENT_TIMELINE, ROUTE_NOTIFICATIONS,
} from 'InvestCommon/helpers/enums/routes';
import { storeToRefs } from 'pinia';
import VSvgIcon from 'UiKit/components/VSvgIcon/VSvgIcon.vue';
import {
  urlContactUs, urlOffers, urlNotifications, urlProfileAccreditation,
  urlInvestmentTimeline, urlProfileWallet, urlProfileAccount,
} from 'InvestCommon/global/links';

const notificationsStore = useNotificationsStore();
const { isMarkAsReadByIdError } = storeToRefs(notificationsStore);
const usersStore = useUsersStore();
const { selectedUserProfileId } = storeToRefs(usersStore);

const props = defineProps({
  data: Object as PropType<INotification>,
  search: String,
  external: Boolean, // is the component external and nee links instead of router
});

const isNotificationInvestment = computed(() => props.data?.type.toLowerCase().includes('investment'));
const isNotificationDocument = computed(() => props.data?.type.toLowerCase().includes('document'));
const isNotificationSystem = computed(() => props.data?.type.toLowerCase().includes('system'));
const isNotificationWallet = computed(() => props.data?.type.toLowerCase().includes('wallet'));
const isNotificationProfile = computed(() => props.data?.type.toLowerCase().includes('profile'));
const objectId = computed(() => (props.data?.data?.fields?.object_id || 0));
const profileId = computed(() => (props.data?.data?.fields?.profile?.ID || objectId.value));
const kycDeclined = computed(() => (props.data?.data?.fields?.kyc_status === 'declined'));
const accreditationDeclined = computed(() => (props.data?.data?.fields?.accreditation_status === 'declined'));
const accreditationExpired = computed(() => (props.data?.data?.fields?.accreditation_status === 'expired'));
const isStart = computed(() => (props.data?.data?.fields?.profile?.kyc_status === 'new'));
const isFundsFailed = computed(() => (props.data?.data?.fields?.funding_status === 'failed'));

const tagBackground = computed(() => {
  if (isNotificationInvestment.value) return '#D9FFEE'; // secondary-light
  if (isNotificationDocument.value) return '#FFF7E8'; // yellow-light
  if (isNotificationSystem.value) return '#DEE2E6'; // gray-30
  if (isNotificationWallet.value) return '#3DDC97'; // secondary
  return '#F8F5FF'; // purple-light
});

const buttonText = computed(() => {
  if (kycDeclined.value || isFundsFailed.value) return 'Contact Us';
  if (accreditationDeclined.value || accreditationExpired.value) return 'Provide info';
  if (isNotificationInvestment.value || isNotificationProfile.value || isNotificationWallet.value) return 'See More Details';
  if (isNotificationDocument.value) return 'Review Document';
  if (isStart.value) return 'Start Investing';
  return 'More Info';
});

const tagText = computed(() => {
  if (isNotificationInvestment.value && (objectId.value > 0)) return `Investment #${objectId.value}`;
  return props.data?.type;
});

const buttonTo = computed(() => {
  if (kycDeclined.value || isFundsFailed.value) {
    return urlContactUs;
  }
  if (accreditationDeclined.value || accreditationExpired.value) {
    return {
      name: ROUTE_ACCREDITATION_UPLOAD,
      params: { profileId: profileId.value },
    };
  }
  if (isNotificationInvestment.value) {
    return {
      name: ROUTE_INVESTMENT_TIMELINE,
      params: { profileId: profileId.value, id: objectId.value },
    };
  }
  if (isNotificationDocument.value) {
    return {
      name: ROUTE_NOTIFICATIONS,
    };
  }
  if (isNotificationWallet.value) {
    return {
      name: ROUTE_DASHBOARD_WALLET,
      params: { profileId: profileId.value },
    };
  }
  if (isNotificationProfile.value) {
    return {
      name: ROUTE_DASHBOARD_ACCOUNT,
      params: { profileId: profileId.value },
    };
  }
  if (isStart.value) {
    return urlOffers;
  }
  return {
    name: ROUTE_NOTIFICATIONS,
  };
});

const buttonLink = computed(() => {
  if (kycDeclined.value || isFundsFailed.value) {
    return urlContactUs;
  }
  if (accreditationDeclined.value || accreditationExpired.value) {
    return urlProfileAccreditation(profileId.value);
  }
  if (isNotificationInvestment.value) {
    return urlInvestmentTimeline(profileId.value, objectId.value);
  }
  if (isNotificationDocument.value) {
    return urlNotifications;
  }
  if (isNotificationWallet.value) {
    return urlProfileWallet(profileId.value);
  }
  if (isNotificationProfile.value) {
    return urlProfileAccount(profileId.value);
  }
  if (isStart.value) {
    return urlOffers;
  }
  return urlNotifications;
});

const isUnread = computed(() => (props.data?.status.toLowerCase() === 'unread'));

const onMarkAsRead = async () => {
  if (props.data?.id) {
    await notificationsStore.markAsReadById(props.data?.id);
    if (!isMarkAsReadByIdError.value) void notificationsStore.setNotificationAsRead(props.data?.id);
  }
};

const onButtonClick = () => {
  void onMarkAsRead();
  void notificationsStore.notificationSidebarClose();
};
</script>
<template>
  <tr
    class="WdNotificationTableItem wd-notification-table-item"
    :class="{ 'is--unread': isUnread }"
  >
    <td class="wd-notification-table-item__type-wrap">
      <span class="wd-notification-table-item__type">
        <VTag
          round
          :background="tagBackground"
          class="wd-notification-table-item__tag"
        >
          <span class="wd-notification-table-item__tag-text">
            {{ tagText }}
          </span>
        </VTag>
      </span>
    </td>
    <td>
      <div class="wd-notification-table-item__content-wrap">
        <div>
          <span
            v-if="data?.created_at"
            class="wd-notification-table-item__date is--h6__title"
          >
            {{ formatToDate(new Date(data?.created_at).toISOString(), true) }}
          </span>
          <p
            v-highlight="search"
            class="wd-notification-table-item__content is--body"
            v-html="data?.content"
          />
        </div>

        <VButton
          size="small"
          variant="link"
          icon-placement="right"
          :tag="external ? 'a' : 'router-link'"
          :to="buttonTo"
          :href="buttonLink || buttonTo"
          class="wd-notification-table-item__button"
          @click="onButtonClick"
        >
          {{ buttonText }}
          <VSvgIcon
            name="arrow-right"
            class="wd-notification-table-item__icon"
            alt="modal layout close icon"
          />
        </VButton>
      </div>
      <span
        v-if="isUnread"
        class="wd-notification-table-item__dot"
        @click.stop="onMarkAsRead"
      />
    </td>
  </tr>
</template>

<style lang="scss">
.wd-notification-table-item {
  display: table-row;

  &.is--unread td {
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

  &__tag {
    flex-shrink: 0;
    max-width: 100%;
    white-space: nowrap;
  }

  &__type-wrap {
    width: fit-content;
    flex: 1 0 0;
  }

  &__tag-text {
    text-transform: capitalize;
  }

  &__content-wrap {
    display: flex;
    align-items: center;
    gap: 32px;
    justify-content: space-between;
    height: 100%;
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
  }

  &__icon {
    width: 16px;
  }
}
</style>
