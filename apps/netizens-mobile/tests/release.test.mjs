import { test } from "node:test";
import assert from "node:assert/strict";
import { validateRelease } from "../scripts/validate-release-config.mjs";
test("release gate rejects missing app ownership/config and privileged public credentials", () => {
  assert.ok(validateRelease({ scheme: "netizens" }, {}).length > 0);
  const config = {
    scheme: "netizens",
    owner: "big271",
    slug: "netizens-mobile",
    ios: { bundleIdentifier: "com.big271.netizens" },
    android: { package: "com.big271.netizens" },
    extra: { eas: { projectId: "5f86b3a0-9d3b-4982-a05c-2aa6c4b3f0da" } },
  };
  const env = {
    EXPO_PUBLIC_SUPABASE_URL: "https://udygizxcwqoxifqlyfkq.supabase.co",
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

test("release gate rejects a wrong app, EAS tenant or Supabase backend", () => {
  const config = {
    scheme: "netizens",
    owner: "big271",
    slug: "netizens-mobile",
    ios: { bundleIdentifier: "com.big271.netizens" },
    android: { package: "com.big271.netizens" },
    extra: { eas: { projectId: "5f86b3a0-9d3b-4982-a05c-2aa6c4b3f0da" } },
  };
  const env = {
    EXPO_PUBLIC_SUPABASE_URL: "https://udygizxcwqoxifqlyfkq.supabase.co",
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_public",
  };
  assert.deepEqual(validateRelease(config, env), []);
  assert.deepEqual(validateRelease(config, { ...env, EXPO_PUBLIC_SUPABASE_URL: "https://other.supabase.co" }), ["NETIZENS dedicated Supabase project URL required"]);
  assert.ok(validateRelease({ ...config, owner: "other" }, env).some((error) => /Expo owner/.test(error)));
  assert.ok(validateRelease({ ...config, android: { package: "com.other.app" } }, env).some((error) => /identifiers mismatch/.test(error)));
  assert.ok(validateRelease({ ...config, extra: { eas: { projectId: "other" } } }, env).some((error) => /EAS project/.test(error)));
  assert.deepEqual(validateRelease(config, { ...env, EXPO_PUBLIC_SUPABASE_URL: env.EXPO_PUBLIC_SUPABASE_URL + "/" }), []);
});
