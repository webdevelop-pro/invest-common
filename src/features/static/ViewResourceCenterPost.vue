<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, watch,
} from 'vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';
import VBlogContent from 'UiKit/components/VPage/VBlog/VBlogContent.vue';
import { useData, useRoute } from 'vitepress';
import { useBreadcrumbs } from 'UiKit/composables/useBreadcrumbs';
import { IFrontmatter } from 'UiKit/types/types';

const VBlogReadMore = defineAsyncComponent({
  loader: () => import('UiKit/components/VPage/VBlog/VBlogReadMore.vue'),
  hydrate: hydrateOnVisible(),
});

const VBreadcrumbs = defineAsyncComponent({
  loader: () => import('UiKit/components/VBreadcrumb/VBreadcrumbsList.vue'),
  hydrate: hydrateOnVisible(),
});

const { page, frontmatter } = useData();
const breadcrumbsList = computed(() => (
  useBreadcrumbs(page, frontmatter)
));
const currentPost = computed(() => frontmatter.value as IFrontmatter);
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
  <div
    class="ViewResourceCenterPost view-resource-center-post is--page"
  >
    <div class="is--container">
      <template v-if="currentPost">
        <div
          itemscope
          itemtype="https://schema.org/BlogPosting"
        >
          <VBlogContent
            :current-post="currentPost"
          >
            <Content class="with-default-distance" />
          </VBlogContent>
        </div>
        <VBlogReadMore class="view-resource-center-post__more is--margin-top-130" />
        <VBreadcrumbs
          v-if="breadcrumbsList"
          :data="breadcrumbsList"
          class="is--margin-top-130"
        />
      </template>
      <p
        v-if="!currentPost"
        class="is--no-data"
      >
        Article not found
      </p>
    </div>
  </div>
</template>
