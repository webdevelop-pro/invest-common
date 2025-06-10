<script setup lang="ts">
import VButton from 'UiKit/components/Base/VButton/VButton.vue';
// Importing social icons
import GoogleIcon from 'InvestCommon/assets/images/social-login/google1.svg?component';
// import FacebookIcon from 'InvestCommon/assets/images/social-login/facebook1.svg?component';
import GithubIcon from 'InvestCommon/assets/images/social-login/github1.svg?component';
import LinkedinIcon from 'InvestCommon/assets/images/social-login/linkedin1.svg?component';
import GoogleHoverIcon from 'InvestCommon/assets/images/social-login/google1-hover.svg?component';
// import FacebookHoverIcon from 'InvestCommon/assets/images/social-login/facebook-hover.svg?component';
import GithubHoverIcon from 'InvestCommon/assets/images/social-login/github1-hover.svg?component';
import LinkedinHoverIcon from 'InvestCommon/assets/images/social-login/linkedin-hover.svg?component';

const emit = defineEmits<{(e: 'click', provider: string): void;
}>();

const socialSignin = [
  {
    icon: GoogleIcon,
    iconHover: GoogleHoverIcon,
    provider: 'google',
    classes: 'login-social-google',
  },
  // {
  //   icon: FacebookIcon,
  //   iconHover: FacebookHoverIcon,
  //   provider: 'facebook',
  //   classes: 'login-social-facebook',
  // },
  {
    icon: GithubIcon,
    iconHover: GithubHoverIcon,
    provider: 'github',
    classes: 'login-social-github',
  },
  {
    icon: LinkedinIcon,
    iconHover: LinkedinHoverIcon,
    provider: 'linkedin',
    classes: 'login-social-linkedin',
  },
];
</script>

<template>
  <div class="VFormAuthSocial social-form">
    <VButton
      v-for="item in socialSignin"
      :key="item.provider"
      variant="tetriary"
      size="large"
      class="social-form__item"
      :class="item.classes"
      @click.stop.prevent="emit('click', item.provider)"
    >
      <component
        :is="item.icon"
        :alt="item.classes"
        class="social-form__item-icon"
      />
      <component
        :is="item.iconHover"
        :alt="item.classes"
        class="social-form__item-icon-hover"
      />
    </VButton>
  </div>
</template>

<style lang="scss">
.social-form {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  align-self: stretch;
  width: 100%;

  &__item-icon,
  &__item-icon-hover {
    width: 20px;
    height: 20px;
    transition: all 0.3s ease;
  }

  &__item-icon-hover {
    display: none;
  }

  &__item {
    flex: 1 1 auto;

    &:hover {
      .social-form__item-icon {
        display: none;
      }
      .social-form__item-icon-hover {
        display: block;
      }
    }
  }
}
</style>
