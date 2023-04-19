import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Box } from "./Box";
import { Heading } from "./Heading";
import { LogoutButton } from "./LogoutButton";
import { Space } from "./Space";
import { Text } from "./Text";

const styles = StyleSheet.create({
  base: {
    marginLeft: 4,
  },
  fill: {
    flexShrink: 1,
    flexGrow: 1,
  },
  button: {
    marginTop: -6,
    marginRight: -20,
  },
});

type Props = {
  title: string;
  subtitle: string;
};

export const ListHeader = ({ title, subtitle }: Props) => (
  <View style={styles.base}>
    <Box alignItems="start" direction="row">
      <Heading variant="h2" style={styles.fill}>
        {title}
      </Heading>

      <LogoutButton style={styles.button} />
    </Box>

    <Text>{subtitle}</Text>
    <Space height={24} />
  </View>
);
