import { useToast } from 'UiKit/components/Base/VToast/use-toast';
import { useRepositoryAnalytics } from 'InvestCommon/data/analytics/analytics.repository';
import { ErrorResponse } from './handlers/errorHandler';

const { toast } = useToast();

const TOAST_OPTIONS = {
  title: 'Something went wrong',
  description: 'Please try again',
  variant: 'error',
};

export const globalErrorHandling = async (errorResponse: ErrorResponse, comment: string) => {
  console.log(errorResponse.data)
  // Send error to analytics before showing toast
  try {
    const analytics = useRepositoryAnalytics();
    await analytics.setMessage({
      time: errorResponse.data.timestamp,
      level: 'error',
      message: errorResponse.message,
      error: comment || 'Unknown error',
      data: {
        component: 'globalErrorHandling',
        caller: ['error-handling'],
        stack: [errorResponse.stack],
        serviceContext: {
          httpRequest: errorResponse.data.httpRequest,
        },
      },
    });
  } catch (analyticsError) {
    // Don't let analytics errors break the main flow
    console.error('Failed to send error to analytics:', analyticsError);
  }

  // Show toast notification
  toast({
    ...TOAST_OPTIONS,
    title: comment || TOAST_OPTIONS.title,
    description: errorResponse.message || TOAST_OPTIONS.description,
  });
};
