<script setup lang="ts">
import { computed } from 'vue';
import VAccreditationButton from 'InvestCommon/features/accreditation/VAccreditationButton.vue';
import VKycButton from 'InvestCommon/features/kyc/VKycButton.vue';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';
import { storeToRefs } from 'pinia';
import VProfileSelectList from 'InvestCommon/features/profiles/VProfileSelectList.vue';
import DashboardTopInfoRight from './DashboardTopInfoRight.vue';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryAuth } from 'InvestCommon/data/auth/auth.repository';
import { useRepositoryProfiles } from 'InvestCommon/data/profiles/profiles.repository';

const userSessionStore = useSessionStore();
const { userSessionTraits } = storeToRefs(userSessionStore);
const { getSessionState } = useRepositoryAuth();

const useRepositoryProfilesStore = useRepositoryProfiles();
const { getUserState, getProfileByIdState } = storeToRefs(useRepositoryProfilesStore);

const isLoading = computed(() => (getUserState.value.loading || getProfileByIdState.value.loading));

</script>

<template>
  <div class="dashboard-top-info">
    <div class="dashboard-top-info__content-left">
      <div class="dashboard-top-info__title-wrap">
        <div class="dashboard-top-info__title is--h3__title">
          Welcome back,

          <VSkeleton
            v-if="getSessionState.loading"
            height="33px"
            width="250px"
            class="dashboard-top-info__title-skeleton"
          />
          <span>{{ userSessionTraits?.first_name }}
          </span>
        </div>
      </div>
      <div class="dashboard-top-info__select-profile">
        <VProfileSelectList
          size="medium"
        />
      </div>
      <div class="dashboard-top-info__item-status">
        <div class="dashboard-top-info__item-label is--h6__title">
          Identity Verification (KYC):
        </div>
        <VKycButton
          :is-loading="isLoading"
          class="dashboard-top-info__status"
        />
      </div>
      <div class="dashboard-top-info__item-status">
        <div class="dashboard-top-info__item-label is--h6__title">
          Accreditation Verification:
        </div>
        <VAccreditationButton
          :is-loading="isLoading"
          class="dashboard-top-info__status"
        />
      </div>
    </div>
    <DashboardTopInfoRight />
  </div>
</template>

<style lang="scss">
.dashboard-top-info {
  $root: &;

  display: flex;
    align-items: flex-end;
    gap: 80px;

    @media screen and (max-width: $desktop-md){
      flex-direction: column;
      align-items: flex-start;
      gap: 40px;
    }

  &__content-left {
    display: flex;
    max-width: 533px;
    width: 100%;
    flex-direction: column;
    align-items: flex-start;

    @media screen and (max-width: $desktop-md){
      max-width: 100%;
    }
  }

  &__item {
    display: flex;
    padding: 20px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    flex: 1 0 0;
  }

  &__item-label {
    color: $gray-70;
  }

  &__status {
    @media screen and (max-width: $mobile-xs){
      white-space: nowrap;
      align-self: flex-end;
    }
  }

  &__select-profile {
    width: 100%;
    margin-bottom: 12px;
  }

  &__item-status {
    display: flex;
    align-items: center;
    align-self: stretch;
    padding-left: 12px;
    min-height: 32px;

    & + & {
      margin-top: 4px;
    }
    #{$root}__item-label {
      min-width: 174px;
    }

    @media screen and (max-width: $mobile-xs){
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }
  }

  &__title {
    margin-bottom: 12px;
  }

  &__title-skeleton {
    display: inline-block;
  }

  &__item-currency {
    color: $black;
  }

  &__item-coin {
    margin-left: -8px;
  }

  &__item-change {
    color: $gray-60;
    visibility: hidden;

    &.is--positive {
    color: $secondary-dark;
    }

    &.is--negative {
    color: $red;
    }

    &.is--show {
      visibility: visible;
    }
  }
}
</style>
