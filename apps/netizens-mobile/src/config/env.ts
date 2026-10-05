export type PublicEnv = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type EnvSource = Record<string, string | undefined>;

export function readPublicEnv(source?: EnvSource): PublicEnv {
  if (source) {
    const privileged = Object.entries(source).find(([name, value]) => /SERVICE[_-]?ROLE/i.test(name) && Boolean(value));
    if (privileged) throw new Error(`Privileged Supabase credential is forbidden in the mobile client: ${privileged[0]}`);
  }

  const supabaseUrl = source?.EXPO_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = source?.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  return { supabaseUrl, supabasePublishableKey };
}
