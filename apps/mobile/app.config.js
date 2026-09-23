/** @type {import('expo/config').ExpoConfig} */
const appJson = require("./app.json");

/** Dev client uses a separate app id so release APK can stay installed. */
const IS_DEV_CLIENT = process.env.APP_VARIANT === "development";

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
const baseScheme = IS_DEV_CLIENT ? "mobile-dev" : appJson.expo.scheme;
const scheme = googleScheme ? [baseScheme, googleScheme] : baseScheme;

module.exports = {
  expo: {
    ...appJson.expo,
    name: IS_DEV_CLIENT ? "Musti Dev" : appJson.expo.name,
    scheme,
    android: {
      ...appJson.expo.android,
      package: IS_DEV_CLIENT
        ? "com.musti.app.dev"
        : appJson.expo.android.package,
      ...(googleIntentFilter
        ? { intentFilters: [googleIntentFilter] }
        : {}),
    },
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: IS_DEV_CLIENT
        ? "com.musti.app.dev"
        : appJson.expo.ios.bundleIdentifier,
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      "expo-dev-client",
      "react-native-document-scanner-plugin",
      "expo-sensors",
      [
        "expo-image-picker",
        {
          photosPermission:
            "Allow access to your photos to import receipt images.",
        },
      ],
    ],
  },
};
