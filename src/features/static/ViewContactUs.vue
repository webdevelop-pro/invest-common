<script setup lang="ts">
import { useData } from 'vitepress';
import ContactUsForm from 'InvestCommon/components/forms/VFormContactUs.vue';
import { useGlobalLoader } from 'UiKit/store/useGlobalLoader';

const { frontmatter } = useData();

useGlobalLoader().hide();
</script>

<template>
  <div class="ViewContactUs view-contact-us is--page">
    <div class="is--container">
      <div class="view-contact-us__wrap">
        <h1 class="view-contact-us__title">
          {{ frontmatter.title }}
        </h1>

        <ContactUsForm />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.view-contact-us {
  width: 100%;
  padding-bottom: 70px;

  &__wrap {
    max-width: 753px;
    margin: 0 auto;
  }

  &__title {
    text-align: center;
    margin-bottom: 40px;
  }
}
</style>
