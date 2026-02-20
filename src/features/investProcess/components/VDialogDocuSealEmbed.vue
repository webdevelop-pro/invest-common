<script setup lang="ts">
import { computed } from 'vue';
import { DocusealForm } from '@docuseal/vue';
import {
  VDialogContent, VDialog,
} from 'UiKit/components/Base/VDialog';
import env from 'InvestCommon/domain/config/env';

const props = defineProps({
  slug: {
    type: String,
    required: true,
  },
  token: {
    type: String,
    default: '',
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});
const openValue = defineModel<boolean>();

const docusealBase = computed(() => (env.DOCUSEAL_URL || '').replace(/\/$/, ''));
const docusealHost = computed(() => {
  const base = docusealBase.value;
  if (!base) return '';
  try {
    const url = new URL(base.startsWith('http') ? base : `https://${base}`);
    return url.host;
  } catch {
    return base.replace(/^https?:\/\//, '').split('/')[0] || '';
  }
});

const embedUrl = computed(() => {
  const base = docusealBase.value;
  if (!base || !props.slug) return '';
  const path = base.endsWith('/s') ? `${base}/${props.slug}` : `${base}/s/${props.slug}`;
  const query = props.token ? `?token=${encodeURIComponent(props.token)}` : '';
  return `${path}${query}`;
});

const onComplete = () => {
  openValue.value = false;
};
</script>

<template>
  <VDialog
    v-model:open="openValue"
    query-key="popup"
    query-value="docuseal"
  >
    <VDialogContent
      :aria-describedby="undefined"
      full-screen
      class="v-dialog-docuseal-embed"
    >
      <DocusealForm
        v-if="embedUrl && docusealHost"
        :src="embedUrl"
        :host="docusealHost"
        :token="token"
        class="v-dialog-docuseal-embed__form"
        @complete="onComplete"
      />
    </VDialogContent>
  </VDialog>
</template>

<style lang="scss">
.v-dialog-docuseal-embed {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &__form {
    flex: 1;
    min-height: 400px;
    width: 100%;
    display: block;

    // Web component from @docuseal/vue
    &:deep(docuseal-form) {
      display: block;
      width: 100%;
      min-height: 400px;
    }
  }
}
</style>
