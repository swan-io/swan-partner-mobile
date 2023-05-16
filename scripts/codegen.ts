import type { CodegenConfig } from "@graphql-codegen/cli";
import type { Types } from "@graphql-codegen/plugin-helpers";
import { Kind, visit } from "graphql";
import { resolve } from "pathe";

const file = (path: string) => resolve(__dirname, path);

const addTypenames: Types.DocumentTransformFunction = ({ documents }) =>
  documents.map(({ document, ...rest }) => {
    if (!document) {
      return rest;
    }

    return {
      ...rest,
      document: visit(document, {
        SelectionSet: {
          leave(node) {
            const hasTypename = node.selections.some(
              (selection) =>
                selection.kind === Kind.FIELD &&
                (selection.name.value === "__typename" ||
                  selection.name.value.lastIndexOf("__", 0) === 0),
            );

            if (!hasTypename) {
              node.selections = [
                { kind: Kind.FIELD, name: { kind: Kind.NAME, value: "__typename" } },
                ...node.selections,
              ];
            }
          },
        },
      }),
    };
  });

const config: CodegenConfig = {
  errorsOnly: true,
  overwrite: true,

  hooks: {
    afterAllFileWrite: "prettier --write",
  },

  generates: {
    [file("../src/graphql/index.tsx")]: {
      documents: file("../src/graphql/index.gql"),
      schema: file("../src/graphql/schema.gql"),
      documentTransforms: [{ transform: addTypenames }],
      plugins: [
        "typescript",
        "typescript-operations",
        "typed-document-node",
        "typescript-urql-graphcache",
      ],
      config: {
        dedupeOperationSuffix: true,
        enumsAsTypes: true,
        nonOptionalTypename: true,
        defaultScalarType: "unknown",
        inlineFragmentTypes: "combine",
        scalars: {
          AccountNumber: "string",
          AmountValue: "string",
          BIC: "string",
          CCA2: "string",
          CCA3: "string",
          Currency: "string",
          Date: "string",
          DateTime: "string",
          EmailAddress: "string",
          HexColorCode: "string",
          IBAN: "string",
          PIN: "string",
          PhoneNumber: "string",
          PostalCode: "string",
          SepaCreditorIdentifier: "string",
          SepaReference: "string",
          URL: "string",
          Upload: "unknown",
          WalletToken: "string",
        },
      },
    },

    [file("../src/graphql/introspection.json")]: {
      schema: file("../src/graphql/schema.gql"),
      plugins: ["introspection"],
      config: { descriptions: false },
      hooks: {
        afterOneFileWrite: "yarn tsx ./scripts/cleanIntrospection.ts",
      },
    },
  },
};

export default config;
