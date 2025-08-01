<script setup lang="ts">
import { PropType } from 'vue';
import ReadOnlyForm, { IReadOnlyForm } from 'UiKit/components/VInfo/VInfoFormReadOnly.vue';
import { RouteLocationRaw, useRouter } from 'vue-router';

const props = defineProps({
  loading: Boolean,
  routerPush: {
    type: Object as PropType<RouteLocationRaw>,
    required: true,
  },
  info: Object as PropType<IReadOnlyForm>,
})

const router = useRouter();

const onClick = () => {
  router.push(props.routerPush);
};
</script>

<template>
  <ReadOnlyForm
    :data="info"
    :loading="loading"
    @edit="onClick"
  />
</template>
