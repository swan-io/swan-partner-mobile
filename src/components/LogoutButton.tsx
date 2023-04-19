import * as React from "react";
import { StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { colors } from "../constants/colors";
import { t } from "../utils/i18n";
import { logout } from "../utils/logout";
import { Icon } from "./Icon";

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});

type Props = {
  style?: StyleProp<ViewStyle>;
};

export const LogoutButton = ({ style }: Props) => {
  const handleOnPress = React.useCallback(() => {
    void logout();
  }, []);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={t("logoutButton.text")}
      onPress={handleOnPress}
      style={[styles.base, style]}
    >
      <Icon color={colors.gray[900]} name="sign-out" size={28} />
    </TouchableOpacity>
  );
};
