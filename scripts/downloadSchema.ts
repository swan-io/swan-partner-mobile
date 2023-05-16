import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import fs from "node:fs/promises";
import path from "pathe";

const { PARTNER_API_URL } = process.env;

if (!PARTNER_API_URL) {
  throw new Error("PARTNER_API_URL environment variable is not set");
}

fetch(PARTNER_API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: getIntrospectionQuery() }),
})
  .then((response) => response.json())
  .then((json) => buildClientSchema(json.data))
  .then((schema) => printSchema(schema))
  .then((schema) =>
    fs.writeFile(path.resolve(__dirname, "..", "src", "graphql", "schema.gql"), schema, "utf-8"),
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
