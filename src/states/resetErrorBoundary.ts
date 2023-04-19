import { atom } from "react-atomic-state";

const state = atom<(() => void) | undefined>(undefined);

export const setResetErrorBoundary = state.set;
export const resetErrorBoundary = () => state.get()?.();
