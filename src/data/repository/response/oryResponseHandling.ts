import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { IAuthFlow } from 'InvestCommon/data/auth/auth.type';
import { h } from 'vue';

type OryUiMessage = {
  type?: string;
  text?: string;
  context?: {
    duplicate_identifier?: string;
    duplicateIdentifier?: string;
  };
};

/**
 * Handles successful Ory auth flow responses that contain UI messages or special states
 * This is for successful responses (200 status) that need special handling
 * @param response - The successful auth flow response
 * @param flowType - The type of flow (login, registration, etc.)
 */
export const oryResponseHandling = (response: IAuthFlow) => {
  const { toast } = useToast();
  const messages = (response.ui?.messages ?? []) as OryUiMessage[];

  const duplicateMessage = messages.find((message) =>
    message.text?.includes('already used by another account')
    || message.context?.duplicate_identifier
    || message.context?.duplicateIdentifier
  );

  // Handle choose_method state with duplicate identifier scenario
  if (duplicateMessage) {
    const duplicateIdentifier = duplicateMessage.context?.duplicate_identifier
      || duplicateMessage.context?.duplicateIdentifier
      || '';
    const loginHref = `/signin?email=${encodeURIComponent(duplicateIdentifier)}`;

    toast({
      title: 'Account Already Exists',
      description: h('div', [
        h('span', `Sorry, your email ${duplicateIdentifier} already used, do you want to `),
        h('a', { href: loginHref }, 'log in'),
        h('span', '?'),
      ]),
      variant: 'info',
      duration: 8000,
    });

    return;
  }

  // Handle other UI messages that might need attention
  const infoMessages = messages.filter((message) => message.type === 'info');
  if (infoMessages && infoMessages.length > 0) {
    const importantMessage = infoMessages[0];

    if (importantMessage) {
      toast({
        title: 'Authentication Information',
        description: importantMessage.text,
        variant: 'info',
      });
    }
  }

  return;
};
