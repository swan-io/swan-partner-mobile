import * as React from "react";
import {
  Text as BaseText,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigatorRouteProps } from "../Navigator";
import { AddToApplePayButton } from "../components/AddToApplePayButton";
import { AddToGooglePayButton } from "../components/AddToGooglePayButton";
import { CreditCard } from "../components/CreditCard";
import { Fill } from "../components/Fill";
import { Space } from "../components/Space";
import { Text } from "../components/Text";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { GetDigitalCardsEncryptedInfoDocument } from "../graphql";
import { Wallet } from "../modules/Wallet";
import { handleErrorWithAlert } from "../states/alerts";
import { t } from "../utils/i18n";
import { isNotNullish, isNullish } from "../utils/nullish";
import { getClient, parseOperationResult } from "../utils/urql";

const serviceName = Platform.OS === "ios" ? "Apple Wallet" : "Google Pay";

const window = Dimensions.get("window");
const cardWidth = window.width * 0.75;

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    flexGrow: 1,
    flexShrink: 1,
  },
  text: {
    marginHorizontal: 48,
  },
  semibold: {
    ...typography.weight600,
  },
  laterButton: {
    padding: 24,
  },
});

export const CardDetailsScreen = ({
  navigation: { goBack },
  route: { params },
}: NavigatorRouteProps<"CardDetails">) => {
  const { cardId, designUrl, holderName, digitalCardId, lastFourDigits, textColor } = params;
  const insets = useSafeAreaInsets();

  const onWalletButtonPress = React.useCallback(() => {
    Wallet.getSignatureData({ holderName, lastFourDigits })
      .then((signatureData) =>
        getClient()
          .query(GetDigitalCardsEncryptedInfoDocument, { cardId, digitalCardId, signatureData })
          .toPromise(),
      )
      .then(parseOperationResult)
      .then(({ card }) => card?.digitalCards.edges[0]?.node)
      .then((digitalCard) =>
        digitalCard?.__typename !== "PendingDigitalCard" ||
        isNullish(digitalCard.inAppProvisioningData)
          ? Promise.reject(new Error("Could not get in-app provisioning data"))
          : digitalCard.inAppProvisioningData,
      )
      .then((inAppProvisioningData) => Wallet.addCard({ lastFourDigits, ...inAppProvisioningData }))
      .then((success) => {
        if (success) {
          goBack();
        }
      })
      .catch((error?: Error) => {
        if (isNotNullish(error)) {
          handleErrorWithAlert(error);
        }
      });
  }, [cardId, digitalCardId, holderName, lastFourDigits, goBack]);

  return (
    <View
      style={[
        styles.base,
        {
          paddingTop: Math.max(insets.top, 24) + 24,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <CreditCard
        designUrl={designUrl}
        textColor={textColor}
        lastFourDigits={lastFourDigits}
        width={cardWidth}
      />

      <Space height={32} />

      <Text align="center" color={colors.gray[700]} style={styles.text}>
        {t("cardDetailsScreen.descriptionStart")}
        <BaseText style={styles.semibold}> {serviceName} </BaseText>
        {t("cardDetailsScreen.descriptionEnd")}
      </Text>

      <Fill minHeight={16} />

      {Platform.OS === "ios" ? (
        <AddToApplePayButton onPress={onWalletButtonPress} />
      ) : (
        <AddToGooglePayButton onPress={onWalletButtonPress} />
      )}

      <TouchableOpacity accessibilityRole="button" onPress={goBack} style={styles.laterButton}>
        <Text align="center" variant="regular">
          {t("cardDetailsScreen.laterButton")}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
