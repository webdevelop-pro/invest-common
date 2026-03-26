import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import PortfolioInvestmentsTable from '../PortfolioInvestmentsTable.vue';

const search = ref('');
const filterPortfolio = ref([]);
const totalResults = ref(0);
const isFiltering = ref(false);
const filteredData = ref([]);
const filterResults = ref(0);
const queryId = ref(undefined);
const getInvestmentsState = ref({
  loading: false,
  error: new Error('Failed to fetch'),
  data: undefined,
});

vi.mock('../../store/useDashboardPortfolio', () => ({
  useDashboardPortfolioStore: () => ({
    onApplyFilter: vi.fn(),
  }),
}));

vi.mock('pinia', async (importOriginal) => {
  const actual = await importOriginal<typeof import('pinia')>();
  return {
    ...actual,
    storeToRefs: () => ({
      search,
      filterPortfolio,
      totalResults,
      isFiltering,
      filteredData,
      filterResults,
      queryId,
      getInvestmentsState,
    }),
  };
});

describe('PortfolioInvestmentsTable', () => {
  it('renders the offline unavailable state when portfolio data is missing offline', () => {
    const wrapper = mount(PortfolioInvestmentsTable, {
      global: {
        stubs: {
          VAlert: {
            template: '<div><slot name="title" /><slot name="description" /><slot /></div>',
          },
          VButton: {
            template: '<button><slot /></button>',
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="offline-data-unavailable"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Portfolio unavailable offline');
  });
});
