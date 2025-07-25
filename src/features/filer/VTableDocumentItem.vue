<script setup lang="ts">
import { PropType, ref } from 'vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import file from 'UiKit/assets/images/file.svg';
import download from 'UiKit/assets/images/download.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';

const props = defineProps({
  data: Object as PropType<IFilerItemFormatted>,
  search: String,
  loading: Boolean,
});

const emit = defineEmits(['click']);

const isLoading = ref(false);

const onDocumentClick = async () => {
  emit('click', props.data);
  isLoading.value = true;
  const url = props.data?.url;

  if (url) {
    window.open(url, '_blank');
  }
  isLoading.value = false;
};

</script>
<template>
  <VTableRow
    class="VTableDocumentItem v-table-document-item"
    @click.stop="onDocumentClick"
  >
    <VTableCell>
      <div class="v-table-document-item__name-wrap">
        <file
          alt="file icon"
          class="v-table-document-item__icon"
        />
        <div v-highlight="search">
          {{ data?.name }}
        </div>
      </div>
    </VTableCell>
    <VTableCell class="v-table-document-item__tags">
      <VBadge
        :class="data?.tagColor"
      >
        {{ data?.typeFormatted }}
      </VBadge>
      <VBadge
        v-if="data?.isNew"
        class="is--background-red-light"
      >
        New
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-document-item__date-wrap is--small">
      {{ data?.date }}
    </VTableCell>
    <VTableCell class="v-table-document-item__download-wrap">
      <VButton
        size="small"
        variant="link"
        :loading="loading || isLoading"
        :disabled="loading || isLoading"
        @click.stop="onDocumentClick"
      >
        <download
          alt="file icon"
          class="v-table-document-item__download-icon"
        />
        Download
      </VButton>
    </VTableCell>
  </VTableRow>
</template>

<style lang="scss">
.v-table-document-item {
  width: 100%;
  cursor: pointer !important;

  &__icon {
    width: 20px;
    height: 20px;
    color: $gray-70;
    margin-right: 16px;
    flex-shrink: 0;
  }

  &__name-wrap {
    display: flex;
    align-items: center;
  }

  &__download-icon {
    width: 16px;
  }

  &__tags {
    display: flex;
    gap: 4px;
    width: 260px;
  }
}
</style>
