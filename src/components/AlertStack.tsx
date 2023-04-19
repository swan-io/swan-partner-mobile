import * as React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { closeAlert, useAlerts } from "../states/alerts";
import { FadeView } from "./FadeView";
import { Icon } from "./Icon";
import { Space } from "./Space";
import { Text } from "./Text";

const styles = StyleSheet.create({
  base: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  alert: {
    borderRadius: 4,
    overflow: "hidden",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.negative[50],
    borderRadius: 4,
    overflow: "hidden",
    borderColor: colors.negative[200],
    borderWidth: 1,

    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    shadowOpacity: 0.08,

    elevation: 5,
  },
  text: {
    color: colors.negative[600],
    flexShrink: 1,
    flexGrow: 1,
    paddingLeft: 20,
    paddingVertical: 16,
  },
  button: {
    padding: 16,
  },
  border: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.negative[500],
  },
});

type Props = {
  text: string;
  uid: string;
};

const Alert = ({ text, uid }: Props) => {
  const handleOnClose = React.useCallback(() => {
    closeAlert(uid);
  }, [uid]);

  return (
    <FadeView visible={true} style={styles.alert}>
      <View style={styles.content}>
        <Text style={styles.text}>{text}</Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleOnClose}
          style={styles.button}
        >
          <Icon name="dismiss-circle" size={20} color={colors.negative[700]} />
        </TouchableOpacity>
      </View>

      <View accessibilityRole="none" style={styles.border} />
    </FadeView>
  );
};

export const AlertStack = () => {
  const insets = useSafeAreaInsets();
  const alerts = useAlerts();

  if (alerts.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.base,
        {
          paddingLeft: insets.left + 24,
          paddingRight: insets.left + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {alerts.map((alert) => (
        <React.Fragment key={alert.uid}>
          <Space height={8} />
          <Alert text={alert.text} uid={alert.uid} />
        </React.Fragment>
      ))}
    </View>
  );
};
