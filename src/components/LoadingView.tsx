import * as React from "react";
import { ActivityIndicator, Animated, Easing, StyleSheet } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

const AnimatedSafeAreaView = Animated.createAnimatedComponent(SafeAreaView);

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  edges?: Edge[];
  error?: Error;
};

export const LoadingView = ({ edges }: Props) => {
  const opacity = useAnimatedValue(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity]);

  React.useEffect(() => {
    let mounted = true;

    setTimeout(() => {
      mounted && setVisible(true);
    }, 500);

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AnimatedSafeAreaView mode="padding" edges={edges} style={[styles.base, { opacity }]}>
      <ActivityIndicator size="small" color={colors.gray[500]} />
    </AnimatedSafeAreaView>
  );
};
