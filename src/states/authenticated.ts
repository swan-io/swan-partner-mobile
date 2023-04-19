import { atom, useAtom } from "react-atomic-state";

const state = atom<boolean | undefined>(undefined);

export const setAuthenticated = state.set;
export const useAuthenticated = () => useAtom(state);
