import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useUsersStore } from 'InvestCommon/store/useUsers';
import { AccreditationTypes, AccreditationTextStatuses } from 'InvestCommon/data/accreditation/accreditation.types';
import { ROUTE_ACCREDITATION_UPLOAD, ROUTE_DASHBOARD_PERSONAL_DETAILS } from 'InvestCommon/helpers/enums/routes';
import { useAccreditationButton } from '../useAccreditationButton';

const routerMock = { push: vi.fn() };

vi.mock('vue-router', () => ({
  useRouter: () => routerMock,
  useRoute: () => ({
    query: {},
    params: {},
  }),
}));

describe('useAccreditationButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    routerMock.push.mockClear();
  });

  it('should initialize with correct default values', () => {
    const store = useAccreditationButton();
    expect(store.isLoading).toBe(true);
  });

  it('should compute correct data for new accreditation status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.new,
      escrow_id: null,
    });
    vi.spyOn(usersStore, 'selectedUserProfileId', 'get').mockReturnValue(123);

    expect(store.data).toEqual({
      ...AccreditationTextStatuses[AccreditationTypes.new],
      to: {
        name: ROUTE_ACCREDITATION_UPLOAD,
        params: { profileId: 123 },
      },
    });
  });

  it('should compute correct tag background for approved status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.approved,
    });
    expect(store.tagBackground).toBe('secondary');
  });

  it('should compute correct tag background and class for declined status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    const mockProfileData = {
      accreditation_status: 'declined' as AccreditationTypes,
    };
    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue(mockProfileData);
    expect(store.tagBackground).toBe('red');
  });

  it('should compute correct tag background for pending status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.pending,
    });
    expect(store.tagBackground).toBe('yellow');
  });

  it('should be clickable for new accreditation status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.new,
    });
    expect(store.isAccreditationIsClickable).toBe(true);
  });

  it('should not be clickable for pending accreditation status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.pending,
    });
    expect(store.isAccreditationIsClickable).toBe(false);
  });

  it('should not be clickable for approved accreditation status', () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.approved,
    });
    expect(store.isAccreditationIsClickable).toBe(false);
  });

  it('should handle click when user is logged in and accreditation is clickable', async () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'userLoggedIn', 'get').mockReturnValue(true);
    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.new,
      escrow_id: null,
    });
    vi.spyOn(usersStore, 'selectedUserProfileId', 'get').mockReturnValue(123);

    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_DASHBOARD_PERSONAL_DETAILS,
      params: { profileId: 123 },
      query: { accreditation: true },
    });
  });

  it('should handle click when user has escrow_id', async () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'userLoggedIn', 'get').mockReturnValue(true);
    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.new,
      escrow_id: 'escrow123',
    });
    vi.spyOn(usersStore, 'selectedUserProfileId', 'get').mockReturnValue(123);

    await store.onClick();
    expect(routerMock.push).toHaveBeenCalledWith({
      name: ROUTE_ACCREDITATION_UPLOAD,
      params: { profileId: 123 },
    });
  });

  it('should not handle click when user is not logged in', async () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'userLoggedIn', 'get').mockReturnValue(false);
    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.new,
    });

    await store.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it('should not handle click when accreditation is not clickable', async () => {
    const store = useAccreditationButton();
    const usersStore = useUsersStore();

    vi.spyOn(usersStore, 'userLoggedIn', 'get').mockReturnValue(true);
    vi.spyOn(usersStore, 'selectedUserProfileId', 'get').mockReturnValue(123);

    // pending
    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.pending,
      escrow_id: null,
    });
    await store.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();

    // approved
    vi.spyOn(usersStore, 'selectedUserProfileData', 'get').mockReturnValue({
      accreditation_status: AccreditationTypes.approved,
      escrow_id: null,
    });
    await store.onClick();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
