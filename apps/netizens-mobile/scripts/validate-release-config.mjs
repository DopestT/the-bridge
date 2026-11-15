import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
export function validateRelease(config, env) {
  const errors = [];
  if (config.scheme !== "netizens") errors.push("netizens URL scheme required");
  if (config.owner !== "big271" || config.slug !== "netizens-mobile")
    errors.push("NETIZENS Expo owner/slug mismatch");
  if (config.ios?.bundleIdentifier !== "com.big271.netizens" ||
      config.android?.package !== "com.big271.netizens")
    errors.push("NETIZENS iOS/Android application identifiers mismatch");
  if (config.extra?.eas?.projectId !== "5f86b3a0-9d3b-4982-a05c-2aa6c4b3f0da")
    errors.push("NETIZENS EAS project ID mismatch");
  const backendUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  if (backendUrl !== "https://udygizxcwqoxifqlyfkq.supabase.co" &&
      backendUrl !== "https://udygizxcwqoxifqlyfkq.supabase.co/")
    errors.push("NETIZENS dedicated Supabase project URL required");
  const key = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (!key || key.startsWith("sb_secret_"))
    errors.push("Public Supabase credential required");
  if (
    Object.entries(env).some(
      ([name, value]) =>
        value &&
        name.startsWith("EXPO_PUBLIC_") &&
        /SERVICE.?ROLE|SECRET/i.test(name),
    )
  )
    errors.push("Privileged public credential forbidden");
  if (key.split(".").length === 3) {
    try {
      if (
        JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
          .role !== "anon"
      )
        errors.push("Only anon legacy JWT keys are allowed");
    } catch {
      errors.push("Malformed public key");
    }
  }
  return errors;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const config = JSON.parse(
    readFileSync(process.argv[2] ?? "release-config.json", "utf8"),
  );
  const errors = validateRelease(config.expo ?? config, process.env);
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log("Release configuration passed; device gates remain separate.");
}
