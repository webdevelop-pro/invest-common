<script setup lang="ts">
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { PropType } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import VTooltip from 'UiKit/components/VTooltip.vue';

interface IActivityItem {
  date: string;
  time: string;
  ip: string;
  browser: string;
  id: string;
  current?: boolean;
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
  <VTableRow
    class="VTableActivityItem v-table-activity-item"
  >
    <VTableCell>
      {{ data?.date }}
      <div class="is--small is--color-gray-60">
        {{ data?.time }}
      </div>
    </VTableCell>
    <VTableCell>
      <a
        :href="`https://ipinfo.io/${data?.ip}`"
        target="_blank"
        rel="noopener noreferrer"
        :title="data?.ip"
        class="is--link-regular"
      >
        {{ data?.ip }}
      </a>
    </VTableCell>
    <VTableCell>
      {{ data?.browser }}
    </VTableCell>
    <VTableCell class="v-table-activity-item__cell-button">
      <VTooltip :disabled="!data.current">
        <VButton
          size="small"
          color="red"
          variant="link"
          :disabled="data.current"
          :loading="loading"
          class="v-table-activity-item__button"
          @click="onDeleteSession"
        >
          Finish Session
        </VButton>
        <template #content>
          <p>
            Cannot revoke current session
          </p>
        </template>
      </VTooltip>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-activity-item {
  &__cell-button {
    flex-shrink: 0;
    min-width: 142px;
  }
}
</style>
