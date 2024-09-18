<script setup lang="ts">
import { computed, PropType, ref } from 'vue';
import SocialLinks from 'UiKit/components/common/SocialLinks/SocialLinks.vue';
import { useHubspotForm } from 'InvestCommon/composable';
import AppLayoutDefaultFooterMenu from './AppLayoutDefaultFooterMenu.vue';
import AppLayoutDefaultFooterText from './AppLayoutDefaultFooterText.vue';
import FooterSubscribeForm from 'UiKit/components/common/FooterSubscribeForm/FooterSubscribeForm.vue';
import { notify } from '@kyvg/vue3-notification';


interface ISocial {
  icon: String,
  iconName: String,
  href: String,
  name: String,
  shareHref?: String,
}
type MenuItem = {
  to?: string;
  href?: string;
  text: string;
  children?: MenuItem[];
}

const props = defineProps({
  socialList: Array as PropType<ISocial[]>,
  hubspotFormId: String,
  menu: Array as PropType<MenuItem[]>,
});

const NOTIFY_OPTIONS = {
  text: 'Submitted!',
  type: 'success',
  data: {
    status: 1,
  },
  group: 'transaction',
  duration: 10000,
};

const currentYear = new Date().getFullYear();

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
  notify(NOTIFY_OPTIONS);
};
</script>

<template>
  <!-- eslint-disable vue/no-multiple-template-root -->
  <div class="AppLayoutDefaultFooter footer-top">
    <div class="wd-container">
      <div class="footer-top__wrap">
        <div class="footer-top__form-wrap">
          <FooterSubscribeForm
            :loading="loadingSubmitting"
            class="footer-top__form"
            @submit="onSubmit"
          />

          <div class="social-links desktop-social">
            <SocialLinks
              :social-list="socialList"
              class="wd-layout-default-footer__socials"
            />
          </div>
        </div>

        <div
          v-for="(item, index) in contactList"
          :key="index"
          class="footer-top__contact"
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
        <AppLayoutDefaultFooterMenu
          :menu="menu"
          class="footer-top__menu"
        />
      </div>
    </div>
  </div>
  <AppLayoutDefaultFooterText />
  <div class="footer-bottom">
    <div class="wd-container">
      <p class="is--small">
        © {{ currentYear }} Webdevelop PRO, Inc.
      </p>
    </div>
  </div>
</template>


<style lang="scss">
.footer-top {
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
  }
  &__menu {
    @include media-lte(desktop) {
      width: 100%;
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
