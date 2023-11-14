import { useFocusEffect } from "@react-navigation/native";
import * as React from "react";
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  FlatList,
  ListRenderItem,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { P, match } from "ts-pattern";
import { useMutation } from "urql";
import { NavigatorRouteProps } from "../Navigator";
import { Box } from "../components/Box";
import { CreditCard } from "../components/CreditCard";
import { Heading } from "../components/Heading";
import { Icon } from "../components/Icon";
import { NoCreditCardIllustration } from "../components/Illustrations";
import { ListHeader } from "../components/ListHeader";
import { LoadingView } from "../components/LoadingView";
import { Space } from "../components/Space";
import { Text } from "../components/Text";
import { colors } from "../constants/colors";
import { AddDigitalCardDocument, CardListDocument, CardListQueryVariables } from "../graphql";
import { InAppBrowser } from "../modules/InAppBrowser";
import { Card, Wallet } from "../modules/Wallet";
import { handleErrorWithAlert } from "../states/alerts";
import { env } from "../utils/env";
import { t } from "../utils/i18n";
import { isEmpty, isNotNullish, isNotNullishOrEmpty, isNullish } from "../utils/nullish";
import { parseOperationResult, useBasicQuery } from "../utils/urql";

const serviceName = Platform.OS === "ios" ? "Apple Wallet" : "Google Pay";

const window = Dimensions.get("window");
const cardWidth = window.width - 24 * 4;

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
    flexShrink: 1,
  },
  item: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 24,

    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 8,
    shadowOpacity: 0.08,

    elevation: 5,
  },
  actionLine: {
    alignItems: "center",
    flexDirection: "row",
    height: 32,
    justifyContent: "center",
  },
  loader: {
    padding: 24,
  },
});

type ListItemProps = {
  mode: "add" | "show" | "added" | "error";
  designUrl: string;
  holderName: string;
  id: string;
  lastFourDigits: string;
  passURLOrToken?: string;
  textColor: string;
  onCallback: (digitalCardId: string) => void;
};

const ListItem = ({
  mode,
  designUrl,
  holderName,
  id,
  lastFourDigits,
  passURLOrToken,
  textColor,
  onCallback,
}: ListItemProps) => {
  const disabled = mode === "added" || mode === "error";
  const [{ fetching }, addDigitalCard] = useMutation(AddDigitalCardDocument);

  const handleAddCard = React.useCallback(() => {
    addDigitalCard({
      input: {
        cardId: id,
        walletProvider: Platform.OS === "ios" ? "ApplePay" : "GooglePay",
        consentRedirectUrl: env.DEEPLINK_CALLBACK_URL,
      },
    })
      .then(parseOperationResult)
      .then((data) => data.addDigitalCard)
      .then((data) =>
        match(data)
          .with({ __typename: "AddDigitalCardSuccessPayload" }, ({ digitalCard }) => {
            const { statusInfo } = digitalCard;

            if (statusInfo.__typename === "DigitalCardConsentPendingStatusInfo") {
              void InAppBrowser.open(statusInfo.consent.consentUrl, {
                dismissButtonStyle: "cancel",
                onCallback: ({ resourceId, env, status }) => {
                  if (isNotNullishOrEmpty(resourceId) && env === "Live" && status === "Accepted") {
                    onCallback(digitalCard.id);
                  }
                },
              });
            }
          })
          .with({ __typename: P.any }, ({ message }) => {
            const error = new Error(message);
            return Promise.reject(error);
          })
          .exhaustive(),
      )
      .catch((error: Error) => {
        handleErrorWithAlert(error);
      });
  }, [addDigitalCard, onCallback, id]);

  const handleShowCard = React.useCallback(() => {
    if (isNotNullish(passURLOrToken)) {
      Wallet.showCard(passURLOrToken).catch((error: Error) => {
        handleErrorWithAlert(error);
      });
    }
  }, [passURLOrToken]);

  return (
    <View style={styles.item}>
      <Heading variant="h4">{holderName}</Heading>
      <Space height={24} />

      <CreditCard
        designUrl={designUrl}
        textColor={textColor}
        lastFourDigits={lastFourDigits}
        width={cardWidth}
      />

      <Space height={24} />

      {fetching ? (
        <ActivityIndicator size="small" color={colors.gray[500]} style={styles.actionLine} />
      ) : (
        <TouchableOpacity
          accessibilityRole="button"
          disabled={disabled}
          style={styles.actionLine}
          onPress={match(mode)
            .with("add", () => handleAddCard)
            .with("show", () => handleShowCard)
            .with("added", "error", () => undefined)
            .exhaustive()}
        >
          <Text numberOfLines={1}>
            {match(mode)
              .with("add", () => t("cardListScreen.addCardButton", { serviceName }))
              .with("show", () => t("cardListScreen.showCardButton", { serviceName }))
              .with("added", () => t("cardListScreen.alreadyAdded", { serviceName }))
              .with("error", () => t("cardListScreen.cannotBeAdded", { serviceName }))
              .exhaustive()}
          </Text>

          {!disabled && (
            <>
              <Space width={8} />
              <Icon name="chevron-right" size={16} color={colors.gray[400]} />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export const CardListScreen = ({ navigation: { navigate } }: NavigatorRouteProps<"CardList">) => {
  const insets = useSafeAreaInsets();

  const [variables, setVariables] = React.useState<CardListQueryVariables>({ first: 10 });
  const { fetching, data } = useBasicQuery({ query: CardListDocument, variables });

  const [cardsInWallet, setCardsInWallet] = React.useState<
    { tag: "fetching" } | { tag: "data"; cards: Card[] } | { tag: "error" }
  >({ tag: "fetching" });

  const hasBeenFetchedOnce = isNotNullish(data);
  const initialFetching = (fetching && !hasBeenFetchedOnce) || cardsInWallet.tag === "fetching";
  const additionalFetching = fetching && hasBeenFetchedOnce;

  const cards = data?.cards;
  const pageInfo = cards?.pageInfo;
  const edges = cards?.edges;
  const userId = data?.user?.id;

  const hasNextPage = Boolean(pageInfo?.hasNextPage);
  const endCursor = pageInfo?.endCursor;

  const fetchWalletCards = React.useCallback(() => {
    Wallet.getCards()
      .then((cards) => setCardsInWallet({ tag: "data", cards }))
      .catch(() => setCardsInWallet({ tag: "error" }));
  }, []);

  useFocusEffect(fetchWalletCards);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        fetchWalletCards();
      }
    });

    return subscription.remove;
  }, [fetchWalletCards]);

  const renderItem: ListRenderItem<NonNullable<typeof data>["cards"]["edges"][number]> =
    React.useCallback(
      ({ item: { node } }) => {
        const { accountMembership, cardMaskedNumber } = node;
        const { statusInfo, user } = accountMembership;
        const holderName = [user?.firstName, user?.lastName].filter(isNotNullish).join(" ");
        const lastFourDigits = cardMaskedNumber.slice(-4);

        if (
          cardsInWallet.tag !== "data" ||
          isNullish(user) ||
          isEmpty(holderName) ||
          statusInfo.status === "BindingUserError"
        ) {
          return null;
        }

        const cardInWallet = cardsInWallet.cards.find(
          (card) => lastFourDigits === card.lastFourDigits,
        );

        const canBeAdded = cardInWallet?.canBeAdded ?? true;
        const designUrl = node.cardDesignUrl;
        const passURLOrToken = cardInWallet?.passURLOrToken;

        const textColor =
          node.cardProduct.cardDesigns[0]?.cardBackground.cardTextColor ?? colors.white;

        return (
          <ListItem
            mode={
              userId !== user.id
                ? "error"
                : canBeAdded
                  ? "add"
                  : isNotNullish(passURLOrToken)
                    ? "show"
                    : "added"
            }
            designUrl={designUrl}
            holderName={holderName}
            id={node.id}
            lastFourDigits={lastFourDigits}
            passURLOrToken={passURLOrToken}
            textColor={textColor}
            onCallback={(digitalCardId) => {
              navigate("CardDetails", {
                cardId: node.id,
                holderName,
                designUrl,
                digitalCardId,
                textColor,
                lastFourDigits,
              });
            }}
          />
        );
      },
      [navigate, cardsInWallet, userId],
    );

  const handleOnEndReached = React.useCallback(() => {
    setVariables(
      (prevVariables): CardListQueryVariables =>
        prevVariables.after === endCursor || !hasNextPage
          ? prevVariables
          : { ...prevVariables, after: endCursor },
    );
  }, [endCursor, hasNextPage]);

  const contentContainerStyle = {
    paddingLeft: insets.left + 24,
    paddingRight: insets.left + 24,
    paddingTop: insets.top + 24,
    paddingBottom: insets.bottom + 24,
  };

  const listHeader = (
    <ListHeader
      title={t("cardListScreen.title")}
      subtitle={t("cardListScreen.description", { serviceName })}
    />
  );

  if (initialFetching || edges?.length === 0 || cardsInWallet.tag === "error") {
    return (
      <View style={[styles.fill, contentContainerStyle]}>
        {listHeader}

        {initialFetching || isNullish(edges) ? (
          <LoadingView />
        ) : (
          <Box alignItems="center" justifyContent="center" style={styles.fill}>
            <NoCreditCardIllustration />
            <Space height={4} />

            <Text variant="medium">
              {cardsInWallet.tag === "error"
                ? t("cardListScreen.noWalletUsageMessage")
                : t("cardListScreen.noCardMessage")}
            </Text>
          </Box>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={edges}
      renderItem={renderItem}
      style={styles.fill}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={() => listHeader}
      ItemSeparatorComponent={() => <Space height={8} />}
      onEndReached={handleOnEndReached}
      ListFooterComponent={
        additionalFetching ? (
          <ActivityIndicator size="small" color={colors.gray[500]} style={styles.loader} />
        ) : null
      }
    />
  );
};
