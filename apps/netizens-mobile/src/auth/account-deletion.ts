import type { PublicEnv } from '../config/env';
type DeletionAuth = {
  signInWithPassword(input: { email: string; password: string }): Promise<{
    data: { session: { access_token: string; user: { id: string; is_anonymous?: boolean } } | null };
    error: unknown;
  }>;
  signOut(input: { scope: 'local' }): Promise<unknown>;
};
export async function deleteOwnAccount(
  env: PublicEnv,
  input: { userId: string; email: string; password: string; confirmation: string },
  auth: DeletionAuth,
  fetcher: typeof fetch = fetch,
  isCurrent: () => boolean = () => true,
): Promise<void> {
  if (input.confirmation !== 'DELETE' || !input.email.trim() || !input.password || !isCurrent())
    throw new Error('Confirm deletion with your account email and current password.');
  try {
    const { data, error } = await auth.signInWithPassword({ email: input.email.trim(), password: input.password });
    if (error || !data.session || data.session.user.id !== input.userId || data.session.user.is_anonymous || !isCurrent())
      throw new Error('Account verification failed.');
    const response = await fetcher(`${env.supabaseUrl}/rest/v1/rpc/delete_own_account`, {
      method: 'POST',
      headers: { apikey: env.supabasePublishableKey, Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_confirmation: input.confirmation }),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok || await response.json() !== true) throw new Error('Account deletion was not confirmed.');
  } finally {
    // This isolated client owns only the temporary reauthentication session.
    // Never revoke the original account session or another device's session here.
    await auth.signOut({ scope: 'local' }).catch(() => undefined);
  }
}
