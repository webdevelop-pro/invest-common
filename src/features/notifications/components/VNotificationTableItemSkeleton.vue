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
