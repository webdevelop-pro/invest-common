<script setup lang="ts">
import {
  computed, defineAsyncComponent, hydrateOnVisible, PropType, ref,
} from 'vue';
import { useHubspotForm } from 'UiKit/composables/useHubspotForm';
import { socials } from 'UiKit/utils/socials';
import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import VFormFooterSkeleton from 'UiKit/components/VForms/VFormFooterSkeleton.vue';

const SocialLinks = defineAsyncComponent({
  loader: () => import('UiKit/components/VSocialLinks/VSocialLinks.vue'),
  hydrate: hydrateOnVisible(),
});

const VFooterText = defineAsyncComponent({
  loader: () => import('./VFooterText.vue'),
  hydrate: hydrateOnVisible(),
});

const VFooterMenu = defineAsyncComponent({
  loader: () => import('UiKit/components/VFooter/VFooterMenu.vue'),
});

const VFormFooterSubscribe = defineAsyncComponent({
  loader: () => import('UiKit/components/VForms/VFormFooterSubscribe.vue'),
  loadingComponent: VFormFooterSkeleton,
  hydrate: hydrateOnVisible(),
});
const VFooterBottom = defineAsyncComponent({
  loader: () => import('UiKit/components/VFooter/VFooterBottom.vue'),
  hydrate: hydrateOnVisible(),
});

interface ISocial {
  icon: string;
  iconName: string;
  href: string;
  name: string;
  shareHref?: string;
}
type MenuItem = {
  to?: string;
  link?: string;
  active?: boolean;
  text: string;
  children?: MenuItem[];
}

const props = defineProps({
  socialList: Array as PropType<ISocial[]>,
  hubspotFormId: String,
  menu: Array as PropType<MenuItem[]>,
  path: String,
  legalItems: Array,
  isColumnMenu: {
    type: Boolean,
    default: false,
  },
});

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Submitted',
  description: 'Form sent success',
  variant: 'success',
};

const contactList = computed(() => ([
  {
    address1: 'USA',
    address2: 'San Francisco',
    phone: '+1 609 733 7724',
    email: 'manager@webdevelop.pro',
  },
]));

const loadingSubmitting = ref(false);
const onSubmit = async (emailLocal: string) => {
  loadingSubmitting.value = true;
  const { submitFormToHubspot } = useHubspotForm(props.hubspotFormId);
  await submitFormToHubspot({
    email: emailLocal,
  });
  loadingSubmitting.value = false;
  toast(TOAST_OPTIONS);
};

const SOCIAL_LIST = [

  socials?.facebook, socials?.instagram,

  socials?.linkedin, socials?.github,
];
</script>

<template>
  <!-- eslint-disable vue/no-multiple-template-root -->
  <div class="VFooter v-footer is--no-margin">
    <div class="is--container">
      <div class="v-footer__wrap">
        <div class="v-footer__form-wrap">
          <VFormFooterSubscribe
            label="Receive latest news:"
            :loading="loadingSubmitting"
            class="v-footer__form"
            @submit="onSubmit"
          />

          <div class="social-links desktop-social">
            <SocialLinks
              :social-list="SOCIAL_LIST"
              class="wd-layout-default-footer__socials"
            />
          </div>
        </div>

        <div
          v-for="(item, index) in contactList"
          :key="index"
          class="v-footer__contact"
        >
          <div class="is--h5__title">
            {{ item.address1 }}
          </div>
          <div>
            {{ item.address2 }}
          </div>
          <div>
            {{ item.phone }}
          </div>
          <div>
            {{ item.email }}
          </div>
        </div>
        <VFooterMenu
          :menu="menu"
          :is-column="isColumnMenu"
          class="v-footer__menu"
        />
      </div>
    </div>
  </div>
  <VFooterText class="v-footer__text" />
  <VFooterBottom
    :items="legalItems"
  />
</template>

<style lang="scss">
.v-footer {
  $root: &;

  background-color: $black;
  padding: 48px 0;
  color: $white;

  @include media-lte(desktop-lg) {
    padding-bottom: 5px;
    padding-top: 50px;
  }

  @include media-lte(tablet) {
    padding-bottom: 5px;
    padding-top: 50px;
  }

  .v-form-group {
    width: 100%;
  }

  &__wrap {
    display: flex;
    gap: 80px;
    justify-content: space-between;

    @include media-lte(desktop-lg) {
      gap: 40px;
    }

    @include media-lte(desktop) {
      max-width: 100%;
      gap: 40px;
      margin: 0 auto;
      flex-wrap: wrap;
    }

    @include media-lte(tablet) {
      max-width: 100%;
      gap: 40px;
      margin: 0 auto;
      flex-wrap: wrap;
    }
  }

  &__group {
    width: 100%;
  }

  &__form-wrap {
    width: 48%;

    @include media-lte(tablet) {
      width: 100%;
    }
  }

  &__form {
    margin-bottom: 32px;
  }

  &__title {
    margin-bottom: 8px;
  }

  &__contact {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 30px;

    a {
      display: block;
      color: $white;

      &:hover {
        text-decoration: underline;
      }
    }

    @include media-lte(tablet) {
      margin-bottom: 0;
    }
  }

  &__menu {
    @include media-lte(desktop) {
      width: 100%;
    }
  }

  &__text {
    @include media-lte(tablet) {
      padding-top: 40px;
    }
  }
}

.footer-bottom {
  background-color: $black;
  padding: 10px 0 16px;

  @include media-lte(tablet) {
    padding-top: 51px;
  }

  p {
    color: $gray-50;
  }
}

.social-links {
  display: flex;
  align-items: center;

  a {
    margin-right: 24px;

    &:last-child {
      margin-right: 0;
    }

    &:hover {
      opacity: .8;
    }

    @include media-lte(tablet) {
      margin-right: 32px;
    }
  }
}
</style>
