<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VSkeleton from 'UiKit/components/Base/VSkeleton/VSkeleton.vue';

</script>
<template>
  <VTableRow
    class="VTableNotificationItem v-table-notification-item is--unread"
  >
    <VTableCell class="v-table-notification-item__badge-loading">
      <VSkeleton
        height="34px"
        width="86px"
      />
    </VTableCell>
    <VTableCell class="v-table-notification-item__text-loading">
      <div class="v-table-notification-item__content-wrap">
        <div>
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
</style>
