import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = useCallback(({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
        sonnerToast.error(title, {
            description: description,
        });
    } else {
        sonnerToast.success(title, {
            description: description,
        });
    }
  }, []);

  return {
    toast,
  };
}

// Named export for convenience
export const toast = (props: ToastProps) => {
    if (props.variant === "destructive") {
        sonnerToast.error(props.title, {
            description: props.description,
        });
    } else {
        sonnerToast.success(props.title, {
            description: props.description,
        });
    }
};
