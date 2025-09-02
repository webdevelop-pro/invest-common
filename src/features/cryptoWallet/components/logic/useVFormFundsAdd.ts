import { ref, watch, type Ref } from 'vue';
import QRCode from 'qrcode';
import { useClipboard } from '@vueuse/core';

export function useVFormFundsAdd(addressRef: Ref<string | undefined>) {
  const qrCodeDataURL = ref<string>('');
  const isGeneratingQR = ref<boolean>(true);
  const { copy, copied } = useClipboard({ legacy: true });

  const generateQR = async () => {
    isGeneratingQR.value = true;
    try {
      if (!addressRef.value) {
        qrCodeDataURL.value = '';
        return;
      }
      qrCodeDataURL.value = await QRCode.toDataURL(addressRef.value, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      isGeneratingQR.value = false;
    }
  };

  watch(() => addressRef.value, () => {
    if (addressRef.value) {
      generateQR();
    } else {
      qrCodeDataURL.value = '';
    }
  }, { immediate: true });

  const onCopyClick = () => {
    if (addressRef.value) {
      copy(addressRef.value);
    }
  };

  return {
    qrCodeDataURL,
    isGeneratingQR,
    copied,
    onCopyClick,
  };
}


