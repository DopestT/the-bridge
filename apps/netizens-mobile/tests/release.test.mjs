import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRelease } from "../scripts/validate-release-config.mjs";
test("release gate rejects missing app ownership/config and privileged public credentials", () => {
  assert.ok(validateRelease({ scheme: "netizens" }, {}).length > 0);
  const config = {
    scheme: "netizens",
    ios: { bundleIdentifier: "com.example.netizens" },
    android: { package: "com.example.netizens" },
    extra: { eas: { projectId: "11111111-1111-4111-8111-111111111111" } },
  };
  const env = {
    EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_public",
  };
  assert.deepEqual(validateRelease(config, env), []);
  assert.ok(
    validateRelease(config, { ...env, EXPO_PUBLIC_SERVICE_ROLE_KEY: "secret" })
      .length > 0,
  );
  assert.ok(
    validateRelease(config, {
      ...env,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_bad",
    }).length > 0,
  );
});
