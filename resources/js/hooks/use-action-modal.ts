import { useState, useCallback } from "react";

export function useActionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: "Confirm Action",
    description: "Are you sure you want to proceed? This action cannot be undone.",
    confirmText: "Confirm",
    cancelText: "Cancel",
    variant: "destructive" as "destructive" | "default" | "outline" | "secondary" | "ghost" | "link",
    onConfirm: null as (() => void) | null,
    isLoading: false,
  });

  const openModal = useCallback((options: Partial<typeof config> = {}) => {
    setConfig((prev) => ({
      ...prev,
      ...options,
    }));
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleConfirm = useCallback(() => {
    if (config.onConfirm) {
      config.onConfirm();
    }
    setIsOpen(false);
  }, [config]);

  return {
    isOpen,
    openModal,
    closeModal,
    modalProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      title: config.title,
      description: config.description,
      confirmText: config.confirmText,
      cancelText: config.cancelText,
      variant: config.variant,
      onConfirm: handleConfirm,
      isLoading: config.isLoading,
    },
  };
}
