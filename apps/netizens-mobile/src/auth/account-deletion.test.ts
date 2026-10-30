import { deleteOwnAccount } from './account-deletion';
const env = { supabaseUrl: 'https://example.test', supabasePublishableKey: 'public' };
const auth = { signInWithPassword: jest.fn(), signOut: jest.fn() };
const input = { userId: 'owner', email: 'citizen@example.test', password: 'current-password', confirmation: 'DELETE' };
let fetcher: jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'fresh-proof', user: { id: 'owner', is_anonymous: false } } }, error: null });
  auth.signOut.mockResolvedValue({ error: null });
  fetcher = jest.fn().mockResolvedValue({ ok: true, json: async () => true });
});
it('reauthenticates then calls self-only deletion with no target identity', async () => {
  await deleteOwnAccount(env, input, auth, fetcher, () => true);
  expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: input.email, password: input.password });
  expect(fetcher.mock.calls[0][0]).toBe('https://example.test/rest/v1/rpc/delete_own_account');
  const init = fetcher.mock.calls[0][1];
  expect(init.headers.Authorization).toBe('Bearer fresh-proof');
  expect(JSON.parse(init.body)).toEqual({ p_confirmation: 'DELETE' });
  expect(init.body).not.toContain(input.password);
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
});
it('rejects another account password session without contacting deletion', async () => {
  auth.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'wrong-user', user: { id: 'other' } } }, error: null });
  await expect(deleteOwnAccount(env, input, auth, fetcher, () => true)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled(); expect(auth.signOut).toHaveBeenCalled();
});
it('requires exact confirmation before even authenticating', async () => {
  await expect(deleteOwnAccount(env, { ...input, confirmation: 'delete' }, auth, fetcher, () => true)).rejects.toThrow();
  expect(auth.signInWithPassword).not.toHaveBeenCalled(); expect(fetcher).not.toHaveBeenCalled();
});
it('a retired runtime cannot complete a late reauthentication deletion', async () => {
  await expect(deleteOwnAccount(env, input, auth, fetcher, () => false)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
it.each([false, null, { deleted: true }])('rejects an unconfirmed server outcome %p', async body => {
  fetcher.mockResolvedValue({ ok: true, json: async () => body });
  await expect(deleteOwnAccount(env, input, auth, fetcher, () => true)).rejects.toThrow();
});
it('a network failure does not become confirmed deletion', async () => {
  fetcher.mockRejectedValue(new Error('offline'));
  await expect(deleteOwnAccount(env, input, auth, fetcher, () => true)).rejects.toThrow();
  expect(auth.signOut).toHaveBeenCalled();
});
