import * as React from "react";
import { Image, ImageProps, View } from "react-native";
import { Except } from "type-fest";

type Props = Except<ImageProps, "fadeDuration" | "source"> & {
  height: number;
  sourceUri: string;
};

export const AutoWidthImage = ({
  accessible,
  accessibilityLabel,
  height,
  sourceUri,
  style,
  ...props
}: Props) => {
  const [size, setSize] = React.useState({ height, width: 0 });

  React.useEffect(() => {
    Image.getSize(sourceUri, (fetchedWidth, fetchedHeight) => {
      const ratio = fetchedHeight / height;
      setSize({ height, width: fetchedWidth / ratio });
    });
  }, [sourceUri, height]);

  return size.width > 0 ? (
    <Image
      accessibilityRole="image"
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      fadeDuration={0}
      style={[style, size]}
      source={{ uri: sourceUri }}
      {...props}
    />
  ) : (
    <View
      accessibilityRole="image"
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      style={[{ height }, style]}
    />
  );
};
