import { Buffer } from "buffer";
import { NativeModules } from "react-native";
import { isNotNullishOrEmpty } from "../utils/nullish";
import { AddCardData, AddCardResponseType, Card, CardInfo, WalletModuleDefinition } from "./Wallet";

const NativeModule = NativeModules.RNWallet as {
  getCards: () => Promise<Card[]>;
  openCard: (token: string) => Promise<void>;
  addCard: (data: AddCardData & { opc: string }) => Promise<AddCardResponseType>;
};

export const Wallet: WalletModuleDefinition = {
  getCards: () => NativeModule.getCards(),
  openCard: (token: string) => NativeModule.openCard(token),

  addCard: async ({
    fetchCardInfo,
    ...data
  }: AddCardData & {
    fetchCardInfo: () => Promise<CardInfo>;
  }) => {
    const {
      activationData,
      encryptedData,
      ephemeralPublicKey,
      iv,
      oaepHashingAlgorithm,
      publicKeyFingerprint,
    } = await fetchCardInfo();

    return NativeModule.addCard({
      ...data,
      opc: Buffer.from(
        JSON.stringify({
          cardInfo: {
            encryptedData: Buffer.from(encryptedData, "base64").toString("hex"),
            iv: isNotNullishOrEmpty(iv) ? Buffer.from(iv, "base64").toString("hex") : undefined,
            publicKeyFingerprint: isNotNullishOrEmpty(publicKeyFingerprint)
              ? Buffer.from(publicKeyFingerprint, "base64").toString("hex")
              : undefined,
            encryptedKey: Buffer.from(ephemeralPublicKey, "base64").toString("hex"),
            oaepHashingAlgorithm:
              isNotNullishOrEmpty(oaepHashingAlgorithm) && oaepHashingAlgorithm.includes("SHA256")
                ? "SHA256"
                : "SHA512",
          },
          tokenizationAuthenticationValue: activationData,
        }),
      ).toString("base64"),
    });
  },
};
