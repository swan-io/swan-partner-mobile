import * as React from "react";
import { Animated, View, ViewProps } from "react-native";
import { useAnimatedValue } from "../hooks/useAnimatedValue";

type Props = ViewProps & {
  duration?: number;
  visible: boolean;
};

export const FadeView = React.forwardRef<View, Props>(
  ({ children, duration = 300, style, visible, ...props }, forwardedRef) => {
    const opacity = useAnimatedValue(0);

    React.useEffect(() => {
      Animated.timing(opacity, {
        duration,
        toValue: visible ? 1 : 0,
        useNativeDriver: true,
      }).start();
    }, [duration, opacity, visible]);

    return (
      <Animated.View ref={forwardedRef} style={[style, { opacity }]} {...props}>
        {children}
      </Animated.View>
    );
  },
);
