<script setup lang="ts">
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VSectionCardArticleList from 'UiKit/components/VCard/VSectionCardArticleList.vue';
import { useData } from 'vitepress';

const { theme } = useData();
const blogPosts = theme.navigation.rc.filterChilds('layout', 'resource-center-single')?.map((post) => post.data);

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewResourceCenter view-resource-center is--page">
    <div class="is--container">
      <h1>Resource Center</h1>
    </div>
    <VSectionCardArticleList
      :items="blogPosts"
      class="is--no-padding is--margin-top-40"
    />
  </div>
</template>

<style lang="scss">
.view-resource-center{
  padding-bottom: 130px;
}
</style>
