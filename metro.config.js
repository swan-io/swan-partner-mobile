const defaultConfig = require("metro-config/src/defaults/defaults");
const exclusionList = require("metro-config/src/defaults/exclusionList");

module.exports = {
  resolver: {
    blockList: exclusionList([/\/server\/.*/]),
    sourceExts: [...defaultConfig.sourceExts, "cjs"],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
