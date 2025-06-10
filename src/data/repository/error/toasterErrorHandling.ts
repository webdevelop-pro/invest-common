import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { ErrorResponse } from './handlers/errorHandler';

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
};

export const toasterErrorHandling = (errorResponse: ErrorResponse, comment: string) => {
  toast({
    ...TOAST_OPTIONS,
    title: comment || TOAST_OPTIONS.title,
    description: errorResponse.message || TOAST_OPTIONS.description,
  });
};
