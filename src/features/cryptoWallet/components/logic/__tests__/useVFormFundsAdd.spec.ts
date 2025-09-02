import { ref, nextTick } from 'vue';
import { describe, it, expect, vi } from 'vitest';

const copyMock = vi.fn();
vi.mock('@vueuse/core', () => ({ useClipboard: () => ({ copy: copyMock, copied: ref(false) }) }));

import { useVFormFundsAdd } from '../useVFormFundsAdd';

describe('useVFormFundsAdd', () => {
  it('generates QR when address is provided', async () => {
    const addressRef = ref<string | undefined>('0xabc');
    const { qrCodeDataURL, isGeneratingQR } = useVFormFundsAdd(addressRef);
    await nextTick();
    await vi.waitUntil(() => isGeneratingQR.value === false, { timeout: 2000 });
    expect(qrCodeDataURL.value).toContain('data:image/png');
  });

  it('clears QR when address is empty', async () => {
    const addressRef = ref<string | undefined>(undefined);
    const { qrCodeDataURL, isGeneratingQR } = useVFormFundsAdd(addressRef);
    await nextTick();
    expect(qrCodeDataURL.value).toBe('');
    expect(isGeneratingQR.value).toBe(true);
  });

  it('copies address to clipboard on click', () => {
    const addressRef = ref<string | undefined>('0xdef');
    const { onCopyClick } = useVFormFundsAdd(addressRef);
    onCopyClick();
    expect(copyMock).toHaveBeenCalledWith('0xdef');
  });
});


