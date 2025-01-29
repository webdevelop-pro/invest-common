<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType } from 'vue';

interface IActivityItem {
  date: string;
  status: string;
  ip: string;
  device: string;
  browser: string;
}

defineProps({
  data: Object as PropType<IActivityItem>,
});

const getTagBackground = (tag:string) => {
  if (tag === 'Unsuccessful Login') {
    return 'red-light';
  }
  return 'secondary-light';
};
</script>

<template>
  <VTableRow>
    <VTableCell>
      {{ data?.date }}
    </VTableCell>
    <VTableCell>
      <div
        v-if="data?.status"
        class="v-table-activity__tag"
      >
        <VBadge
          :color="getTagBackground(data?.status)"
        >
          {{ data?.status }}
        </VBadge>
      </div>
    </VTableCell>
    <VTableCell>
      <a
        href="#"
        class="is--link-regular"
      >
        {{ data?.ip }}
      </a>
    </VTableCell>
    <VTableCell>
      {{ data?.device }}
    </VTableCell>
    <VTableCell>
      {{ data?.browser }}
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-activity {
   &__tag {
     display: flex;
   }
}
</style>
