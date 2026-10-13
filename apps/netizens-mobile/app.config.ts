import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "NETIZENS",
  slug: "netizens-mobile",
  ios: { ...config.ios, bundleIdentifier: process.env.NETIZENS_IOS_BUNDLE_ID },
  android: { ...config.android, package: process.env.NETIZENS_ANDROID_PACKAGE },
  extra: {
    ...config.extra,
    eas: { projectId: process.env.NETIZENS_EAS_PROJECT_ID },
  },
});
