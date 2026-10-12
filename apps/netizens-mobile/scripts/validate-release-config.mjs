import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
export function validateRelease(config, env) {
  const errors = [];
  if (config.scheme !== "netizens") errors.push("netizens URL scheme required");
  for (const id of [config.ios?.bundleIdentifier, config.android?.package])
    if (typeof id !== "string" || !/^([a-zA-Z][\w]*\.)+[\w]+$/.test(id))
      errors.push("Set the confirmed iOS/Android application identifiers");
  if (!config.extra?.eas?.projectId)
    errors.push("Set the existing EAS project ID");
  if (!/^https:\/\//.test(env.EXPO_PUBLIC_SUPABASE_URL ?? ""))
    errors.push("HTTPS Supabase URL required");
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
