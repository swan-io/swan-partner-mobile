import fs from "node:fs";
import os from "node:os";
import url from "node:url";
import path from "pathe";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "..");

const variables = fs
  .readFileSync(path.join(rootPath, ".env.example"), "utf-8")
  .split(os.EOL)
  .map((line) => line.trim())
  .filter((line) => !line.startsWith("#") && line.includes("="))
  .map((line) => line.split("=")[0]);

const typesDef = `declare module "@env" {
  ${variables.map((variable) => `export const ${variable}: string;`).join(os.EOL + "  ")}
}
`;

fs.writeFileSync(
  path.join(rootPath, "src", "types", "react-native-dotenv.d.ts"),
  typesDef,
  "utf-8",
);
