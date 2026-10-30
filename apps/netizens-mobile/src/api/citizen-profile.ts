import type { PublicEnv } from '../config/env';

export const AVATAR_FORMS = ['likeness', 'stylized', 'fictional', 'privacy'] as const;
export const AVATAR_MODES = ['commons', 'crews', 'local', 'projects', 'ask', 'exchange', 'circles', 'events', 'plans', 'yesno'] as const;
export type ProfileInput = {
  handle: string;
  display_name: string;
  avatar_form: typeof AVATAR_FORMS[number];
  avatar_mode: typeof AVATAR_MODES[number];
};
export type Citizen = ProfileInput & {
  id: string;
  status: 'active' | 'limited' | 'suspended' | 'deleted';
  citizen_mark_seed: string;
  xp: number;
  level: number;
  onboarding_completed_at: string | null;
};
export function validateProfile(input: ProfileInput): ProfileInput {
  const handle = input.handle.trim().toLowerCase();
  const display_name = input.display_name.trim();
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(handle))
    throw new Error('Choose a handle of 3–30 letters, numbers, hyphens or underscores.');
  if (!display_name || display_name.length > 60)
    throw new Error('Display name must contain 1–60 characters.');
  if (!AVATAR_FORMS.includes(input.avatar_form) || !AVATAR_MODES.includes(input.avatar_mode))
    throw new Error('Choose a valid avatar form and home Place.');
  return { handle, display_name, avatar_form: input.avatar_form, avatar_mode: input.avatar_mode };
}

export class CitizenProfiles {
  constructor(
    private env: PublicEnv,
    private session: () => { userId: string; accessToken: string },
    private fetcher: typeof fetch = fetch,
  ) {}
  private async request(path: string, body?: unknown): Promise<Citizen[]> {
    const session = this.session();
    let response: Response;
    try {
      response = await this.fetcher(`${this.env.supabaseUrl}/rest/v1/${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { apikey: this.env.supabasePublishableKey, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });
    } catch { throw new Error('Connection unavailable. Your profile has not been saved.'); }
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.code === '23505') throw new Error('This handle is unavailable.');
      if (response.status === 401) throw new Error('Sign in again to continue.');
      if (response.status === 403) throw new Error('This account cannot update its Citizen profile.');
      throw new Error('Profile service unavailable. Try again when connected.');
    }
    const rows: Citizen[] = await response.json();
    if (!Array.isArray(rows) || rows.some(row => row.id !== session.userId))
      throw new Error('Profile service returned an unexpected account.');
    return rows;
  }
  async read(): Promise<Citizen | null> {
    const params = new URLSearchParams({
      id: `eq.${this.session().userId}`, limit: '1',
      select: 'id,handle,display_name,avatar_form,avatar_mode,status,citizen_mark_seed,xp,level,onboarding_completed_at',
    });
    return (await this.request(`citizens?${params}`))[0] ?? null;
  }
  async save(input: ProfileInput): Promise<Citizen> {
    const value = validateProfile(input);
    const rows = await this.request('rpc/complete_citizen_profile', {
      p_handle: value.handle, p_display_name: value.display_name,
      p_avatar_form: value.avatar_form, p_avatar_mode: value.avatar_mode,
    });
    if (rows.length !== 1 || rows[0].status !== 'active' || !rows[0].onboarding_completed_at)
      throw new Error('Profile completion was not confirmed. Try again.');
    return rows[0];
  }
}
