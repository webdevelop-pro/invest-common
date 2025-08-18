import { ref, watch, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { navigateWithQueryParams } from 'UiKit/helpers/general';
import { urlSignin } from 'InvestCommon/global/links';
import { useSessionStore } from 'InvestCommon/domain/session/store/useSession';
import { useRepositoryOffer } from 'InvestCommon/data/offer/offer.repository';
import { useFormValidation } from 'InvestCommon/composable/useFormValidation';
import { getOptions } from 'UiKit/helpers/model';
import { useRoute } from 'vitepress';
import { scrollToError } from 'UiKit/helpers/validation/general';

export type FormModelOfferComment = {
  comment: string;
  offer_id: number;
  related: string;
}

export function useVFormComments(offerId: number) {
  const route = useRoute();

  const offerRepository = useRepositoryOffer();
  const { setOfferCommentState, setOfferCommentOptionsState } = storeToRefs(offerRepository);
  const userSessionStore = useSessionStore();
  const { userLoggedIn } = storeToRefs(userSessionStore);

  const errorData = computed(() => setOfferCommentState.value.error?.data?.responseJson);
  const schemaBackend = computed(() => setOfferCommentOptionsState.value.data);

  const {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
  } = useFormValidation<FormModelOfferComment>(
    undefined,
    schemaBackend,
    {
      offer_id: offerId,
      related: 'none',
    } as FormModelOfferComment,
  );

  const isDisabledButton = computed(() => (!isValid.value));

  const disclosureCheckbox = ref(false);

  const relatedOptions = computed(() => getOptions('related', schemaObject));
  const relatedOptionsFormatted = computed(() => (
    relatedOptions.value?.map((option) => ({ value: option.value, text: option.name })) || []
  ));
  const relatedOptionsFiltered = computed(() => (
    relatedOptionsFormatted.value.filter((option) => option.value !== 'none')
  ));

  const isAuth = computed(() => userLoggedIn.value);

  const sendQuestion = async () => {
    onValidate();
    if (!isValid.value) {
      scrollToError('VFormComments');
      return;
    }

    await offerRepository.setOfferComment(model);
    if (setOfferCommentState.value.data?.id) {
      await offerRepository.getOfferComments(offerId);
      model.comment = '';
    }
  };

  const signInHandler = () => {
    const redirect = `${route.path}${window.location.search}${window.location.hash}`;
    navigateWithQueryParams(urlSignin, { redirect });
  };

  watch(() => disclosureCheckbox.value, (value) => {
    if (!value) model.related = 'none';
  });

  return {
    model,
    validation,
    isValid,
    onValidate,
    schemaObject,
    schemaBackend,
    isDisabledButton,
    disclosureCheckbox,
    relatedOptionsFiltered,
    isAuth,
    sendQuestion,
    signInHandler,
    errorData,
    setOfferCommentState,
    setOfferCommentOptionsState,
  };
}


