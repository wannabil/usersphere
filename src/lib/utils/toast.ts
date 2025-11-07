import { toast as sonnerToast } from 'sonner';

// Re-export for easy imports with sensible defaults
export const toast = {
  success: (message: string, options = {}) => {
    return sonnerToast.success(message, {
      duration: 4000,
      ...options,
    });
  },

  error: (message: string, options = {}) => {
    return sonnerToast.error(message, {
      duration: 5000, // Longer for errors
      ...options,
    });
  },

  info: (message: string, options = {}) => {
    return sonnerToast.info(message, {
      duration: 4000,
      ...options,
    });
  },

  warning: (message: string, options = {}) => {
    return sonnerToast.warning(message, {
      duration: 4000,
      ...options,
    });
  },

  loading: (message: string, options = {}) => {
    return sonnerToast.loading(message, {
      duration: Infinity, // Don't auto-dismiss loading
      ...options,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },

  custom: sonnerToast.custom,

  dismiss: (toastId?: string | number) => {
    return sonnerToast.dismiss(toastId);
  },
};

