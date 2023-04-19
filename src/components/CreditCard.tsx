import * as React from "react";
import { StyleSheet } from "react-native";
import { SvgUri } from "react-native-svg";
import { useBoolean } from "../hooks/useBoolean";
import { AutoWidthImage } from "./AutoWidthImage";
import { FadeView } from "./FadeView";
import { Text } from "./Text";

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  numbers: {
    position: "absolute",
    left: 18,
    bottom: 12,
  },
});

type Props = {
  designUrl: string;
  lastFourDigits: string;
  width: number;
  textColor: string;
};

export const CreditCard = ({ designUrl, lastFourDigits, textColor, width }: Props) => {
  const [imageLoaded, setImageLoaded] = useBoolean(false);
  const height = width / (85 / 55); // Credit card dimensions ratio

  return (
    <FadeView visible={imageLoaded} style={{ height, width }}>
      {designUrl.endsWith(".svg") ? (
        <SvgUri uri={designUrl} onLoad={setImageLoaded.true} style={styles.image} />
      ) : (
        <AutoWidthImage
          resizeMode="stretch"
          sourceUri={designUrl}
          height={height}
          onLoad={setImageLoaded.true}
          style={styles.image}
        />
      )}

      <Text color={textColor} style={styles.numbers}>
        •••• {lastFourDigits}
      </Text>
    </FadeView>
  );
};
