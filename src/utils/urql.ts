import { print as printQuery } from "@0no-co/graphql.web";
import { cacheExchange } from "@urql/exchange-graphcache";
import { relayPagination } from "@urql/exchange-graphcache/extras";
import * as React from "react";
import { atom, useAtom } from "react-atomic-state";
import {
  AnyVariables,
  Client,
  CombinedError,
  Operation,
  OperationResult,
  Provider,
  UseQueryArgs,
  errorExchange,
  fetchExchange,
  useQuery,
} from "urql";
import { GraphCacheConfig } from "../graphql";
import schema from "../graphql/introspection.json";
import { Storage } from "../modules/Storage";
import { env } from "./env";
import { logout } from "./logout";
import { isNotNullish } from "./nullish";

const onError = (
  error: CombinedError,
  { context: { meta }, query: rawQuery, variables }: Operation,
) => {
  const response = error.response as { status?: number } | undefined;

  if (response?.status === 401) {
    void logout();
  } else if (__DEV__) {
    const { graphQLErrors } = error;

    console.error(error, {
      errors: graphQLErrors.map(({ message }) => message),
      meta,
      query: printQuery(rawQuery),
      variables,
    });
  }
};

const customFetch: typeof fetch = async (input, init = {}) => {
  const sessionToken = await Storage.getItem("sessionToken");

  return fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      ...(isNotNullish(sessionToken) ? { "session-token": `Bearer ${sessionToken}` } : {}),
    },
  }).then(async (response) => {
    const nextSessionToken = response.headers.get("next-session-token");

    if (isNotNullish(nextSessionToken)) {
      await Storage.setItem("sessionToken", nextSessionToken);
    }

    return response;
  });
};

const createClient = () =>
  new Client({
    fetch: customFetch,
    url: `${env.API_HOST}/graphql`,
    requestPolicy: "network-only",
    exchanges: [
      cacheExchange<GraphCacheConfig>({
        schema: schema as GraphCacheConfig["schema"],

        keys: {
          AccountHolderIndividualInfo: () => null,

          AccountMembershipBindingUserErrorStatusInfo: () => null,
          AccountMembershipConsentPendingStatusInfo: () => null,
          AccountMembershipDisabledStatusInfo: () => null,
          AccountMembershipEnabledStatusInfo: () => null,
          AccountMembershipInvitationSentStatusInfo: () => null,
          AccountMembershipSuspendedStatusInfo: () => null,

          CardCanceledStatusInfo: () => null,
          CardCancelingStatusInfo: () => null,
          CardConsentPendingStatusInfo: () => null,
          CardEnabledStatusInfo: () => null,
          CardProcessingStatusInfo: () => null,

          DigitalCardConsentPendingStatusInfo: () => null,
          DigitalCardDeclinedStatusInfo: () => null,
          DigitalCardPendingStatusInfo: () => null,

          InAppProvisioningData: () => null,
        },
        resolvers: {
          Query: {
            cards: relayPagination({ mergeMode: "inwards" }),
          },
        },
      }),
      errorExchange({ onError }),
      fetchExchange,
    ],
  });

const client = atom(createClient());
export const getClient = client.get;
export const resetClient = () => client.set(createClient());

type ClientProviderProps = {
  children: React.ReactNode;
};

export const ClientProvider = ({ children }: ClientProviderProps) =>
  React.createElement(Provider, { children, value: useAtom(client) });

export const parseOperationResult = <T>({ error, data }: OperationResult<T>): T => {
  if (typeof error !== "undefined") {
    throw error;
  }

  if (typeof data === "undefined") {
    throw new CombinedError({
      networkError: new Error("No Content"),
    });
  }

  return data;
};

export const useBasicQuery = <Data = unknown, Variables extends AnyVariables = AnyVariables>(
  options: UseQueryArgs<Variables, Data>,
) => {
  const [{ fetching, data, error, ...result }] = useQuery<Data, Variables>(options);

  if (typeof error !== "undefined") {
    throw error;
  }

  return {
    paused: !fetching && typeof data === "undefined",
    fetching,
    data,
    ...result,
  };
};
