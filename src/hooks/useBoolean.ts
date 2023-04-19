import * as React from "react";

export const useBoolean = (initialValue: boolean | (() => boolean)) => {
  const [value, setValue] = React.useState(initialValue);

  return [
    value,
    React.useMemo(
      () => ({
        true: () => setValue(true),
        false: () => setValue(false),
        toggle: () => setValue((prevValue) => !prevValue),
      }),
      [],
    ),
  ] as const;
};
