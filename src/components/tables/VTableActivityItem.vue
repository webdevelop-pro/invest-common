<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';

interface IActivityItem {
  date: string;
  status: string;
  ip: string;
  device: string;
  browser: string;
}

defineProps({
  data: Object as PropType<IActivityItem>,
  loading: Boolean,
});

const emit = defineEmits(['delete']);

const onDeleteSession = () => {
  emit('delete');
};
</script>

<template>
  <VTableRow class="VTableActivityItem v-table-activity-item">
    <VTableCell>
      {{ data?.date }}
      <div class="is--small is--color-gray-60">
        {{ data?.time }}
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
      {{ data?.browser }}
    </VTableCell>
    <VTableCell>
      <VButton
        size="small"
        color="red"
        variant="link"
        :loading="loading"
        @click="onDeleteSession"
      >
        Finish Session
      </VButton>
    </VTableCell>
  </VTableRow>
</template>
