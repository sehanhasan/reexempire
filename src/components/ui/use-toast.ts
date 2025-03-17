
import { useToast, toast as originalToast } from "@/hooks/use-toast";

// Create a wrapper around the original toast function that only allows destructive toasts
const toast = {
  ...originalToast,
  // Override the default toast function to filter non-error toasts
  __call: function(props: any) {
    // Only allow destructive (error) toasts to show
    if (props.variant === "destructive") {
      return originalToast(props);
    }
    // For all other types, just log to console but don't display
    console.info("[Toast suppressed]", props.title, props.description);
    return { id: "suppressed", dismiss: () => {} };
  }
};

// Replace the original toast function with our filtered version
// @ts-ignore - we're replacing the function with our own implementation
toast = Object.assign(toast.__call.bind(toast), toast);

// Export only for errors
export { useToast, toast };
