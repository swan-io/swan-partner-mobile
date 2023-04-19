import { NativeEventEmitter, NativeModules } from "react-native";
import { match } from "ts-pattern";

export type AddCardResponseType = "cancel" | "success";
type CertificateKeyType = "LEAF" | "INTERMEDIATE";

type SignatureData = {
  certificates: { key: CertificateKeyType; value: string }[];
  nonce: string;
  nonceSignature: string;
};

type AddCardEvent =
  | { type: "setCardInfos"; certificates: string[]; nonce: string; nonceSignature: string }
  | { type: "error"; message: string }
  | { type: "cancel" }
  | { type: "success" };

export type AddCardData = {
  cardHolderName: string;
  cardSuffix: string;
  identifier?: string;
};

export type CardInfo = {
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
  openCardInWallet: (passURL: string) => Promise<void>;
  addCard: (data: AddCardData) => void;
  setCardInfo: (info: CardInfo) => void;
};

// @ts-expect-error
const emitter = new NativeEventEmitter(NativeModule);

export const Wallet = {
  getCards: () => NativeModule.getCards(),
  openCardInWallet: (passURL: string) => NativeModule.openCardInWallet(passURL),

  addCard: ({
    fetchCardInfo,
    ...data
  }: AddCardData & { fetchCardInfo: (signatureData?: SignatureData) => Promise<CardInfo> }) =>
    new Promise<AddCardResponseType>((resolve, reject) => {
      emitter.removeAllListeners("addCardEvent");

      emitter.addListener("addCardEvent", (event: AddCardEvent) => {
        match(event)
          .with({ type: "setCardInfos" }, ({ certificates, nonce, nonceSignature }) => {
            fetchCardInfo({
              nonceSignature,
              nonce,
              certificates: certificates.map((value, index) => ({
                key: index === 0 ? "LEAF" : "INTERMEDIATE",
                value,
              })),
            })
              .then((info) => NativeModule.setCardInfo(info))
              .catch((error) => {
                reject(error);
                emitter.removeAllListeners("addCardEvent");
              });
          })
          .with({ type: "error" }, ({ message }) => {
            const error = new Error(message);
            reject(error);
            emitter.removeAllListeners("addCardEvent");
          })
          .with({ type: "cancel" }, { type: "success" }, ({ type }) => {
            resolve(type);
            emitter.removeAllListeners("addCardEvent");
          })
          .exhaustive();
      });

      NativeModule.addCard(data);
    }),
};

export type WalletModuleDefinition = typeof Wallet;
