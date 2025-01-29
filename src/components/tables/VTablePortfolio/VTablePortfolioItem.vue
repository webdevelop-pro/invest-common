<script setup lang="ts">
import {
  PropType, computed, onMounted, watch,
} from 'vue';
import VTableItemHeader from './VTablePortfolioItemHeader.vue';
import VTableItemContent from './VTablePortfolioItemContent.vue';
import { IInvest } from 'InvestCommon/types/api/invest';
import { useRoute } from 'vue-router';

const route = useRoute();
const queryId = computed(() => Number(route.query.id));
const props = defineProps({
  item: {
    type: Object as PropType<IInvest>,
    required: true,
  },
  search: String,
  colspan: Number,
});
const isOpen = defineModel<boolean>();
const scrollTarget = computed(() => `scrollTarget${props.item.id}`);

onMounted(() => {
  if (queryId.value && (props.item.id === queryId.value)) {
    const target = document.getElementById(scrollTarget.value);
    // Ensure the element exists before scrolling
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

watch(() => props.item.id, () => {
  isOpen.value = (props.item.id === queryId.value);
}, { immediate: true });

</script>

<template>
  <VTableItemHeader
    :id="scrollTarget"
    :item="item"
    :search="search"
    :class="{ 'is--open': isOpen }"
    @click="isOpen = !isOpen"
  />
  <!-- eslint-disable-next-line vue/no-multiple-template-root -->
  <VTableItemContent
    v-if="isOpen"
    :item="item"
    :colspan="colspan"
    :class="{ 'is--open': isOpen }"
  />
</template>

