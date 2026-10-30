import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NETIZENS",
  slug: "netizens-mobile",
  owner: "big271",
  ios: { ...config.ios, bundleIdentifier: process.env.NETIZENS_IOS_BUNDLE_ID },
  android: { ...config.android, package: process.env.NETIZENS_ANDROID_PACKAGE },
  extra: {
    ...config.extra,
    eas: { projectId: "5f86b3a0-9d3b-4982-a05c-2aa6c4b3f0da" },
  },
});
