import { NativeModules } from "react-native";

export type Card = {
  lastFourDigits: string;
  canBeAdded: boolean;
  passURLOrToken?: string;
};

type Certificate = {
  key: "LEAF" | "INTERMEDIATE";
  value: string;
};

type SignatureData = {
  certificates: Certificate[];
  nonce: string;
  nonceSignature: string;
};

type GetSignatureDataInput = {
  holderName: string;
  lastFourDigits: string;
};

type AddCardInput = {
  lastFourDigits: string;
  activationData: string;
  encryptedData: string;
  ephemeralPublicKey: string;
  iv?: string | null;
  oaepHashingAlgorithm?: string | null;
  publicKeyFingerprint?: string | null;
};

const NativeModule = NativeModules.RNWallet as {
  getCards: () => Promise<Card[]>;
  getSignatureData: (input: GetSignatureDataInput) => Promise<SignatureData | null>;
  addCard: (input: AddCardInput) => Promise<boolean>;
  showCard: (passURLOrToken: string) => Promise<void>;
};

export const Wallet = {
  getCards: () => NativeModule.getCards(),
  getSignatureData: (input: GetSignatureDataInput) => NativeModule.getSignatureData(input),
  addCard: (input: AddCardInput) => NativeModule.addCard(input),
  showCard: (passURLOrToken: string) => NativeModule.showCard(passURLOrToken),
};
