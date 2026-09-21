/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json");

function getGoogleOAuthIntentFilter() {
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  if (!androidClientId) return null;

  const idPart = androidClientId.replace(/\.apps\.googleusercontent\.com$/, "");
  return {
    action: "VIEW",
    autoVerify: false,
    data: [{ scheme: `com.googleusercontent.apps.${idPart}` }],
    category: ["BROWSABLE", "DEFAULT"],
  };
}

const googleIntentFilter = getGoogleOAuthIntentFilter();
const googleScheme = googleIntentFilter?.data?.[0]?.scheme;
const scheme = googleScheme
  ? [appJson.expo.scheme, googleScheme]
  : appJson.expo.scheme;

module.exports = {
  expo: {
    ...appJson.expo,
    scheme,
    android: {
      ...appJson.expo.android,
      ...(googleIntentFilter
        ? { intentFilters: [googleIntentFilter] }
        : {}),
    },
  },
};
