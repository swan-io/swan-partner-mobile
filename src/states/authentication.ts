import { atom, useAtom } from "react-atomic-state";

type Authentication = "none" | "user";

const state = atom<"loading" | Authentication>("loading");

export const setAuthentication: (value: Authentication) => void = state.set;
export const useAuthentication = () => useAtom(state);
