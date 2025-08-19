import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { setActivePinia, createPinia } from 'pinia';
import { useOffersDetails } from '../useOffersDetails';

let mockPublicFilesData: any;

vi.mock('vitepress', () => ({
  useData: vi.fn(() => ({ page: {}, frontmatter: {} })),
}));

vi.mock('UiKit/composables/useBreadcrumbs', () => ({
  useBreadcrumbs: vi.fn(() => ['Home', 'Offers']),
}));

vi.mock('InvestCommon/global', () => ({
  default: { FILER_URL: 'https://filer.test' },
}));

vi.mock('InvestCommon/data/filer/filer.repository', () => ({
  useRepositoryFiler: vi.fn(() => ({
    getPublicFilesState: ref(mockPublicFilesData),
  })),
}));

describe('useOffersDetails', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockPublicFilesData = {
      data: {
        entities: {
          media: {
            entities: {
              '1': { url: 'https://cdn.example.com/image-1.png' },
              '2': { url: '' },
            },
          },
        },
      },
    };
  });

  it('builds tags and carousel including video, docs and image thumb', () => {
    const offerRef = ref({
      data: { video: 'https://video.example.com/v.mp4' },
      image_link_id: 42,
    } as any);

    const composable = useOffersDetails(offerRef);

    expect(composable.tags).toEqual(['Fintech', 'E-Commerce', 'Network Security']);

    const carousel = composable.carouselFiles.value;
    expect(carousel[0]).toEqual({ video: 'https://video.example.com/v.mp4' });
    expect(carousel.some((i: any) => i.image === 'https://cdn.example.com/image-1.png')).toBe(true);
    const last = carousel[carousel.length - 1] as any;
    expect(last.image).toBe('https://filer.test/public/files/42?size=big');
    expect(last.thumb).toBe('https://filer.test/public/files/42?size=small');
  });

  it('does not append image when only video exists', () => {
    mockPublicFilesData = { data: { entities: { media: { entities: {} } } } };

    const offerRef = ref({
      data: { video: 'https://video.example.com/only.mp4' },
      image_link_id: 77,
    } as any);

    const composable = useOffersDetails(offerRef);
    const carousel = composable.carouselFiles.value;
    expect(carousel).toEqual([{ video: 'https://video.example.com/only.mp4' }]);
  });
});


