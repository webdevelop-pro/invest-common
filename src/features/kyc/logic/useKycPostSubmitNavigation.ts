import type {
  RouteLocationRaw,
  Router,
} from 'vue-router';

type NavigationDependencies = {
  router: Router;
  getBackButtonRoute: () => RouteLocationRaw;
  getProfileById: () => Promise<unknown>;
};

export function useKycPostSubmitNavigation({
  router,
  getBackButtonRoute,
  getProfileById,
}: NavigationDependencies) {
  const finishSubmission = async (hubspotPromise: Promise<void> | null) => {
    await getProfileById();

    if (hubspotPromise) {
      await hubspotPromise;
    }

    await router.push(getBackButtonRoute());
  };

  return {
    finishSubmission,
  };
}
