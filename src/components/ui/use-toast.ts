
import { useToast as originalUseToast, toast as originalToast } from "@/hooks/use-toast";

// Create a type-safe wrapper around the original toast function that only allows destructive toasts
type ToastFunction = typeof originalToast;
type ToastParameters = Parameters<ToastFunction>[0];

// Type-safe wrapper function that handles the filter logic
const filteredToast = (props: ToastParameters) => {
  // Only allow destructive (error) toasts to show
  if (props.variant === "destructive") {
    return originalToast(props);
  }
  // For all other types, just log to console but don't display
  console.info("[Toast suppressed]", props.title, props.description);
  return { id: "suppressed", dismiss: () => {} };
};

// Make sure our filtered toast function has all the same properties as the original
const toast = Object.assign(filteredToast, {
  ...originalToast
});

// Custom hook that uses the original hook but overrides the toast function
function useToast() {
  const originalHookResult = originalUseToast();
  
  return {
    ...originalHookResult,
    toast: filteredToast
  };
}

// Export the custom hook and toast function
export { useToast, toast };
