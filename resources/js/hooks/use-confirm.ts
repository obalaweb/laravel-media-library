import { useState } from 'react';

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmLabel?: string;
    onConfirm: () => void;
}

interface ConfirmState {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
}

const defaultState: ConfirmState = {
    open: false,
    title: 'Are you sure?',
    description: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    onConfirm: () => {},
};

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>(defaultState);

    const confirm = (options: ConfirmOptions) => {
        setState({
            open: true,
            title: options.title ?? defaultState.title,
            description: options.description ?? defaultState.description,
            confirmLabel: options.confirmLabel ?? defaultState.confirmLabel,
            onConfirm: options.onConfirm,
        });
    };

    const handleOpenChange = (open: boolean) => {
        setState((prev) => ({ ...prev, open }));
    };

    return { confirm, confirmModalProps: { ...state, onOpenChange: handleOpenChange } };
}
