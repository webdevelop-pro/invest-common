import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { IAuthFlow } from 'InvestCommon/data/auth/auth.type';
import { h } from 'vue';

/**
 * Handles successful Ory auth flow responses that contain UI messages or special states
 * This is for successful responses (200 status) that need special handling
 * @param response - The successful auth flow response
 * @param flowType - The type of flow (login, registration, etc.)
 */
export const oryResponseHandling = (response: IAuthFlow) => {
  const { toast } = useToast();

  const duplicateMessage = response.ui?.messages?.find((m: any) => 
    m.text?.includes('already used by another account') || 
    m.context?.duplicate_identifier
  );
  
  // Handle choose_method state with duplicate identifier scenario
  if (duplicateMessage) {
    const duplicateIdentifier = duplicateMessage.context?.duplicate_identifier || 
                               duplicateMessage.context?.duplicateIdentifier;

    toast({
       title: 'Account Already Exists',
       description: h('div', {
        innerHTML: `Sorry, your email ${duplicateIdentifier} already used, do you want to <a href="/signin?email=${encodeURIComponent(duplicateIdentifier)}">sign in</a>?`
      }),
       variant: 'info',
       duration: 8000,
     });
    
    return;
  }
  
  // Handle other UI messages that might need attention
  const infoMessages = response.ui?.messages?.filter((m: any) => m.type === 'info');
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

