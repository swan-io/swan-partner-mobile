import { NativeEventEmitter, NativeModules } from "react-native";
import { match } from "ts-pattern";

type Certificate = {
  key: "LEAF" | "INTERMEDIATE";
  value: string;
};

type SignatureData = {
  certificates: Certificate[];
  nonce: string;
  nonceSignature: string;
};

type WalletEvent<Name extends string, Data> = {
  name: Name;
  data: Data;
};

export type AddCardData = {
  cardHolderName: string;
  cardSuffix: string;
  identifier?: string;
};

export type InAppProvisioningData = {
  activationData: string;
  encryptedData: string;
  ephemeralPublicKey: string;
  iv?: string | null;
  publicKeyFingerprint?: string | null;
  oaepHashingAlgorithm?: string | null;
};

export type Card = {
  FPANSuffix: string;
  identifier: string;
  passURL?: string;
  canBeAdded: boolean;
};

const NativeModule = NativeModules.RNWallet as {
  getCards: () => Promise<Card[]>;
  openCard: (passURL: string) => Promise<void>;
  addCard: (data: AddCardData) => void;
  setInAppProvisioningData: (data: InAppProvisioningData) => void;
};

// @ts-expect-error
const emitter = new NativeEventEmitter(NativeModule);
const removeAllListeners = () => emitter.removeAllListeners("onWalletEvent");

export const Wallet = {
  getCards: () => NativeModule.getCards(),
  openCard: (passURL: string) => NativeModule.openCard(passURL),

  addCard: ({
    fetchInAppProvisioningData,
    ...data
  }: AddCardData & {
    fetchInAppProvisioningData: (signatureData?: SignatureData) => Promise<InAppProvisioningData>;
  }) =>
    new Promise<boolean>((resolve, reject) => {
      removeAllListeners();

      emitter.addListener(
        "onWalletEvent",
        (
          event:
            | WalletEvent<"signatureData", SignatureData>
            | WalletEvent<"error", { message: string }>
            | WalletEvent<"finished", { success: boolean }>,
        ) => {
          match(event)
            .with({ name: "signatureData" }, ({ data }) => {
              fetchInAppProvisioningData(data)
                .then((data) => NativeModule.setInAppProvisioningData(data))
                .catch((error) => {
                  reject(error);
                  removeAllListeners();
                });
            })
            .with({ name: "error" }, ({ data }) => {
              reject(new Error(data.message));
              removeAllListeners();
            })
            .with({ name: "finished" }, ({ data }) => {
              resolve(data.success);
              removeAllListeners();
            })
            .exhaustive();
        },
      );

      NativeModule.addCard(data);
    }),
};

export type WalletModuleDefinition = typeof Wallet;
