type Nullish = null | undefined;

export const isNullish = (value: unknown): value is Nullish => value == null;
export const isNotNullish = <T>(value: T | Nullish): value is T => value != null;
