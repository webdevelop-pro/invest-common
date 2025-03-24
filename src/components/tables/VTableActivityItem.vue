<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import { PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useAuthStore } from 'InvestCommon/store/useAuth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { isDeleteOneSessionLoading, isGetAllSessionLoading } = storeToRefs(authStore);

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

const emit = defineEmits(['delete']);

const getTagBackground = (tag:string) => {
  if (tag === 'Unsuccessful Login') {
    return 'red-light';
  }
  return 'secondary-light';
};

const onDeleteSession = () => {
  emit('delete');
};
</script>

<template>
  <VTableRow>
    <VTableCell>
      {{ data?.date }}
    </VTableCell>
    <!-- <VTableCell>
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
    </VTableCell> -->
    <VTableCell>
      <a
        href="#"
        class="is--link-regular"
      >
        {{ data?.ip }}
      </a>
    </VTableCell>
    <!-- <VTableCell>
      {{ data?.device }}
    </VTableCell> -->
    <VTableCell>
      {{ data?.browser }}
    </VTableCell>
    <VTableCell>
      <VButton
        size="small"
        color="red"
        variant="outlined"
        :loading="isDeleteOneSessionLoading || isGetAllSessionLoading"
        @click="onDeleteSession"
      >
        Delete Session
      </VButton>
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
