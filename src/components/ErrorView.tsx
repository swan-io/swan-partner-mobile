import * as React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { t } from "../utils/i18n";
import { logout } from "../utils/logout";
import { Button } from "./Button";
import { WarningIllustration } from "./Illustrations";
import { Space } from "./Space";
import { Text } from "./Text";

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.gray[50],
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
    flexShrink: 1,
  },
});

type Props = {
  error?: Error;
};

export const ErrorView = (_props: Props) => {
  const handleOnLogout = React.useCallback(() => {
    void logout();
  }, []);

  return (
    <SafeAreaView style={styles.base}>
      <WarningIllustration />
      <Space height={8} />
      <Text variant="medium">{t("errorView.text")}</Text>
      <Space height={24} />
      <Button title={t("logoutButton.text")} onPress={handleOnLogout} variant="small" />
    </SafeAreaView>
  );
};
