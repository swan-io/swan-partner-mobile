export const seconds = (value: number) => value * 1000;
export const minutes = (value: number) => value * seconds(60);
export const hours = (value: number) => value * minutes(60);
export const days = (value: number) => value * hours(24);
export const weeks = (value: number) => value * days(7);
