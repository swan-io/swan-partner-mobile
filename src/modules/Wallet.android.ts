import { Buffer } from "buffer";
import { NativeModules } from "react-native";
import { isNotNullishOrEmpty } from "../utils/nullish";
import { AddCardData, Card, InAppProvisioningData, WalletModuleDefinition } from "./Wallet";

const NativeModule = NativeModules.RNWallet as {
  getCards: () => Promise<Card[]>;
  showCard: (token: string) => Promise<void>;
  addCard: (data: AddCardData & { opc: string }) => Promise<boolean>;
};

export const Wallet: WalletModuleDefinition = {
  getCards: () => NativeModule.getCards(),
  showCard: (token: string) => NativeModule.showCard(token),

  addCard: async ({
    fetchInAppProvisioningData,
    ...data
  }: AddCardData & {
    fetchInAppProvisioningData: () => Promise<InAppProvisioningData>;
  }) => {
    const {
      activationData,
      encryptedData,
      ephemeralPublicKey,
      iv,
      oaepHashingAlgorithm,
      publicKeyFingerprint,
    } = await fetchInAppProvisioningData();

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
