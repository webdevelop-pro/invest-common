<script setup lang="ts">
import { PropType, ref, computed, nextTick, onMounted } from 'vue';
import VBadge from 'UiKit/components/Base/VBadge/VBadge.vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import file from 'UiKit/assets/images/file.svg';
import download from 'UiKit/assets/images/download.svg';
import { VTableCell, VTableRow } from 'UiKit/components/Base/VTable';
import { IFilerItemFormatted } from 'InvestCommon/data/filer/filer.type';
import VTooltip from 'UiKit/components/VTooltip.vue';

const props = defineProps({
  data: Object as PropType<IFilerItemFormatted>,
  search: String,
  loading: Boolean,
  withDownload: Boolean,
});

const emit = defineEmits(['click']);

const isLoading = ref(false);
const nameElementRef = ref<HTMLElement>();
const isTextOverflowing = ref(false);

const checkTextOverflow = () => {
  if (!nameElementRef.value) return false;
  const element = nameElementRef.value;
  return element.scrollWidth > element.clientWidth;
};

const shouldShowTooltip = computed(() => 
  props.data?.name && isTextOverflowing.value
);

onMounted(async () => {
  await nextTick();
  // Add a small delay to ensure layout is stable
  setTimeout(() => {
    isTextOverflowing.value = checkTextOverflow();
  }, 50);
});

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
        <VTooltip v-if="shouldShowTooltip">
          <div
            ref="nameElementRef"
            v-highlight="search"
            class="v-table-document-item__name"
          >
            {{ data?.name }}
          </div>
          <template #content>
            <div v-highlight="search">
              {{ data?.name }}
            </div>
          </template>
        </VTooltip>
        <div
          v-else
          ref="nameElementRef"
          v-highlight="search"
          class="v-table-document-item__name"
        >
          {{ data?.name }}
        </div>
        <VBadge
          v-if="data?.isNew"
          class="is--background-red-light"
        >
          New
        </VBadge>
      </div>
    </VTableCell>
    <VTableCell class="v-table-document-item__tags">
      <VBadge
        :class="data?.tagColor"
      >
        {{ data?.typeFormatted }}
      </VBadge>
    </VTableCell>
    <VTableCell class="v-table-document-item__date-wrap is--small is--lt-tablet-hide">
      {{ data?.date }}
    </VTableCell>
    <VTableCell
      v-if="withDownload"
      class="v-table-document-item__download-wrap  is--lt-tablet-hide"
    >
      <VButton
        size="small"
        variant="link"
        :loading="loading || isLoading"
        :disabled="loading || isLoading"
        class="is--margin-top-0"
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
@use 'UiKit/styles/_variables.scss' as *;

.v-table-document-item {
  width: 100%;
  cursor: pointer !important;
  align-items: center;

  @media screen and (max-width: $tablet){
    /* Make table rows more compact on mobile */
    td {
      padding: 8px 12px !important;
    }
  }

  &__icon {
    width: 20px;
    height: 20px;
    color: $gray-70;
    flex-shrink: 0;
  }

  &__name-wrap {
    display: flex;
    align-items: center;
    gap: 16px;

    @media screen and (max-width: $tablet){
      gap: 8px;
    }
  }

  &__name {
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media screen and (max-width: $tablet){
      max-width: 200px;
      flex-wrap: wrap;
    }
  }

  &__download-icon {
    width: 16px;
  }

  &__tags {
    gap: 4px;
    width: 260px;

    @media screen and (max-width: $tablet){
      width: fit-content;
      display: flex;
      justify-content: center;
    }
  }
}
</style>
