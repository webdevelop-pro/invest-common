<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

</script>
<template>
  <VTableRow
    class="VTableNotificationItem v-table-notification-item is--unread"
  >
    <VTableCell class="v-table-notification-item__badge-cell">
      <VSkeleton
        height="34px"
        width="86px"
        radius="24px"
      />
    </VTableCell>
    <VTableCell class="v-table-notification-item__text-cell">
      <div class="v-table-notification-item__content-wrap">
        <div class="v-table-notification-item__text">
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

        <VSkeleton
          height="32px"
          width="133px"
        />
      </div>
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

    @media screen and (width < $tablet){
      width: 100% !important;
    }

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
