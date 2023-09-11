import fs from "node:fs";
import url from "node:url";
import path from "pathe";
import pc from "picocolors";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, "..");

const androidRegExp = /versionCode \d+/;
const iosRegExp = /CURRENT_PROJECT_VERSION = \d+;/g;
const nextVersionCode = Math.floor(Date.now() / 1000).toFixed(0);

const androidFilePath = path.join(rootPath, "android", "app", "build.gradle");
const androidFile = fs.readFileSync(androidFilePath, "utf-8");

if (!androidRegExp.exec(androidFile)) {
  console.error("Could not increment android versionCode");
  process.exit(1);
}

fs.writeFileSync(
  androidFilePath,
  androidFile.replace(androidRegExp, `versionCode ${nextVersionCode}`),
  "utf-8",
);

const iosFilePath = path.join(rootPath, "ios", "Swan.xcodeproj", "project.pbxproj");
const iosFile = fs.readFileSync(iosFilePath, "utf-8");

if (!iosRegExp.exec(iosFile)) {
  console.error("Could not increment ios CFBundleVersion");
  process.exit(1);
}

fs.writeFileSync(
  iosFilePath,
  iosFile.replace(iosRegExp, `CURRENT_PROJECT_VERSION = ${nextVersionCode};`),
  "utf-8",
);

console.log(pc.green(`✅  Version bumped to ${nextVersionCode}`));
