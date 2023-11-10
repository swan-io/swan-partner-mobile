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

type WalletEvent =
  | { name: "signatureData"; data: SignatureData }
  | { name: "error"; data: string }
  | { name: "finished"; data: boolean };

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
const removeAllListeners = () => emitter.removeAllListeners("onAddCardEvent");

export const Wallet = {
  getCards: (): Promise<Card[]> => NativeModule.getCards(),
  openCard: (passURL: string): Promise<void> => NativeModule.openCard(passURL),

  addCard: ({
    fetchInAppProvisioningData,
    ...data
  }: AddCardData & {
    fetchInAppProvisioningData: (signatureData?: SignatureData) => Promise<InAppProvisioningData>;
  }) =>
    new Promise<boolean>((resolve, reject) => {
      removeAllListeners();

      emitter.addListener("onAddCardEvent", (event: WalletEvent) => {
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
            reject(new Error(data));
            removeAllListeners();
          })
          .with({ name: "finished" }, ({ data }) => {
            resolve(data);
            removeAllListeners();
          })
          .exhaustive();
      });

      NativeModule.addCard(data);
    }),
};

export type WalletModuleDefinition = typeof Wallet;
