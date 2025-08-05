
import { toast as originalToast } from "@/hooks/use-toast";

export const toast = (props: Parameters<typeof originalToast>[0]) => {
  return originalToast({
    ...props,
    className: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
  });
};

export * from "@/hooks/use-toast";
