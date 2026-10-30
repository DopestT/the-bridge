const mockValues = new Map<string, string>();
jest.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => mockValues.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => { mockValues.set(key, value); },
  deleteItemAsync: async (key: string) => { mockValues.delete(key); },
}));
beforeEach(() => { jest.resetModules(); mockValues.clear(); });
const session = (userId: string) => ({ userId, accessToken: 'token', refreshToken: 'refresh', expiresAt: Date.now()+60000, isAnonymous: false });
it('erases deleted credentials and rejects late refresh writes for that identity', async () => {
  const { secureSessionStore: store } = jest.requireActual('./secure-session');
  await store.write(session('deleted'));
  await store.eraseAccount('deleted');
  expect(await store.read()).toBeNull();
  await expect(store.write(session('deleted'))).rejects.toThrow();
  expect(mockValues.size).toBe(0);
});
it('erasing a retired account never removes a different account credentials', async () => {
  const { secureSessionStore: store } = jest.requireActual('./secure-session');
  await store.write(session('new-account'));
  await store.eraseAccount('deleted');
  expect((await store.read())?.userId).toBe('new-account');
});
