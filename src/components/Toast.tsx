import { toast as sonnerToast } from "sonner";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

/**
 * Wrapper autour de sonner toast avec icônes cohérentes
 */
export const toast = {
  success: (message: string, description?: string) => {
    return sonnerToast.success(message, {
      description,
      icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    });
  },

  error: (message: string, description?: string) => {
    return sonnerToast.error(message, {
      description,
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
    });
  },

  warning: (message: string, description?: string) => {
    return sonnerToast.warning(message, {
      description,
      icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    });
  },

  info: (message: string, description?: string) => {
    return sonnerToast(message, {
      description,
      icon: <Info className="h-4 w-4 text-blue-600" />,
    });
  },

  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return sonnerToast.promise(promise, messages);
  },
};
