<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import { useData, useRoute } from 'vitepress';
import { watch } from 'vue';

const { frontmatter } = useData();
useGlobalLoader().hide();
const route = useRoute();

watch(
  () => route.path,
  () => {
    setTimeout(() => {
      useGlobalLoader().hide();
    }, 100);
  },
);
</script>

<template>
  <div class="ViewTerms view-terms is--page">
    <div
      class="is--container"
    >
      <h1>
        {{ frontmatter.title }}
      </h1>

      <div
        class="is--margin-top-40"
      >
        <Content class="with-default-distance is--body" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.view-terms {
  width: 100%;
  padding-bottom: 70px;

  a {
    opacity: 0.9;
  }
}
</style>
