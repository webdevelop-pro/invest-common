<script setup lang="ts">
import VAccordionList from 'UiKit/components/VAccordion/VAccordionList.vue';
import { ref } from 'vue';
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
import { useData } from 'vitepress';
import { data as allPages } from '@/store/all.data';
import { filterPages } from 'UiKit/helpers/allData';
import { IFrontmatter } from 'UiKit/types/types';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

const { frontmatter } = useData();

const contactUs = filterPages(allPages as IFrontmatter[], 'layout', 'contact-us');

const data = ref(JSON.parse(JSON.stringify(frontmatter.value.data)));

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewFaq view-faq is--page">
    <div class="is--container is--flex-row">
      <aside class="view-faq__left">
        <div class="with-default-distance is--sticky">
          <h1>
            {{ frontmatter.title }}
          </h1>
          <VButton
            size="large"
            variant="outlined"
            as="a"
            :href="contactUs[0].url"
          >
            Contact Us
          </VButton>
        </div>
      </aside>
      <section class="view-faq__right">
        <VAccordionList
          :data="data"
        />
      </section>
    </div>
  </div>
</template>

<style lang="scss">
.view-faq {
  width: 100%;
  padding-bottom: 70px;

  &__left {
    width: 30%;

    @include media-lt(tablet) {
      width: 100%;
      margin-bottom: 40px;
    }
  }

  &__right {
    width: 66%;

    @include media-lt(tablet) {
      width: 100%;
      margin-bottom: 80px;
    }
  }
}
</style>
