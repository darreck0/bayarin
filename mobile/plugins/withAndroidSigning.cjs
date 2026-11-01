const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, mod => {
    if (mod.modResults.language !== 'groovy') throw new Error('Bayarin signing requires the generated Groovy build file.');
    if (mod.modResults.contents.includes('// Bayarin: release signing')) return mod;
    mod.modResults.contents += `
// Bayarin: release signing is supplied at build time, never stored in source.
if (System.getenv("BAYARIN_KEYSTORE_PATH")) {
  android {
    signingConfigs {
      bayarin {
        storeFile file(System.getenv("BAYARIN_KEYSTORE_PATH"))
        storeType "PKCS12"
        storePassword System.getenv("BAYARIN_STORE_PASSWORD")
        keyAlias "bayarin"
        keyPassword System.getenv("BAYARIN_STORE_PASSWORD")
      }
    }
    buildTypes { release { signingConfig signingConfigs.bayarin } }
  }
}
`;
    return mod;
  });
};
