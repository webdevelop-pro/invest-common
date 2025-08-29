<script setup lang="ts">
import { PropType, ref, computed } from 'vue';
import VAvatar from 'UiKit/components/VAvatar.vue';
import pen from 'UiKit/assets/images/pen.svg?component';
import { useAvatarUpload } from './logic/useAvatarUpload';

const props = defineProps({
  size: String as PropType<'large' | 'medium' | 'small' | 'x-large'>,
  src: String,
  userId: {
    type: Number,
    required: true,
  },
  imageId: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['upload-id']);

const {
  refFiles,
  filesUploadError,
  isLoading: internalIsLoading,
  onClick,
  onFileChange,
} = useAvatarUpload(props, emit);

// Combine prop isLoading with internal loading state
const isLoading = computed(() => props.loading || internalIsLoading.value);

// Local loading state for button click
const isButtonLoading = ref(false);

const handleButtonClick = async () => {
  isButtonLoading.value = true;
  
  try {
    await onClick();
  } finally {
    // Reset loading state after a short delay to ensure smooth transition
    setTimeout(() => {
      isButtonLoading.value = false;
    }, 300);
  }
};
</script>

<template>
  <div 
    class="VAvatarUpload v-account-upload"
    :class="{ 'is-loading': isLoading || isButtonLoading }"
  >
    <VAvatar
      :size="size"
      :src="src"
      :loading="isLoading || isButtonLoading"
      alt="avatar image"
      class="v-account-upload__avatar"
    />
    
    <!-- Loading overlay -->
    <Transition name="fade">
      <div 
        v-if="isLoading || isButtonLoading" 
        class="v-account-upload__loading-overlay"
      >
        <div class="v-account-upload__spinner"></div>
      </div>
    </Transition>

    <!-- Upload button -->
    <div
      role="button"
      class="v-account-upload__button"
      :class="{ 'is-clicked': isButtonLoading }"
      @click="handleButtonClick"
    >
      <input
        id="file-control"
        ref="refFiles"
        name="file"
        type="file"
        accept="image/png, image/jpeg, image/jpg"
        hidden
        @change="onFileChange"
      >
      <Transition name="scale">
        <pen
          v-if="!isLoading && !isButtonLoading"
          class="v-account-upload__icon"
          alt="edit icon"
        />
      </Transition>
    </div>

    <!-- Error message with transition -->
    <Transition name="slide-up">
      <p
        v-if="filesUploadError"
        class="v-account-upload__error"
      >
        {{ filesUploadError }}
      </p>
    </Transition>
  </div>
</template>

<style lang="scss">
@use 'UiKit/styles/_variables.scss' as *;
@use 'UiKit/styles/_colors.scss' as colors;

.v-account-upload {
  $root: &;

  cursor: pointer;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 100%;

  &:hover {
    transform: scale(1.02);
    
    .v-account-upload__button {
      opacity: 1;
      transform: scale(1);
    }
  }

  &.is-loading {
    cursor: not-allowed;
    
    .v-account-upload__avatar {
      filter: brightness(0.7);
    }
  }

  &__avatar {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 100%;
  }

  &__button {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    opacity: 0;
    transform: scale(0.8);
    border-radius: 100%;
    background: rgba(colors.$gray-20, 0.9);
    backdrop-filter: blur(4px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;

    &:hover {
      background: rgba(colors.$gray-20, 1);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    &.is-clicked {
      background: rgba(colors.$gray-30, 0.95);
      transform: scale(0.95);
      transition: all 0.15s ease;
    }
  }

  &__icon {
    width: 34px;
    height: 34px;
    color: colors.$gray-50;
    transition: all 0.2s ease;
    
    &:hover {
      color: colors.$gray-70;
      transform: rotate(15deg);
    }
  }

  &__loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 100%;
    z-index: 2;
  }

  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid transparent;
    border-top: 2px solid colors.$gray-20;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  &__error {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    padding: 8px 12px;
    background: #fee;
    color: #c53030;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    z-index: 10;
    
    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 4px solid #fee;
    }
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.2s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

// Loading spinner animation
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive adjustments
@media screen and (max-width: $tablet-xs) {
  .v-account-upload {
    &__button {
      flex-direction: column;
      align-items: center;
    }
    
    &__icon {
      width: 28px;
      height: 28px;
    }
    
    &__spinner {
      width: 20px;
      height: 20px;
    }
  }
}
</style>
