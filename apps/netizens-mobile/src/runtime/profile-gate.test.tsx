import { AppState, Button, Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { RuntimeProvider, useRuntime } from './RuntimeProvider';

const mockSession = { userId: 'owner', accessToken: 'test', refreshToken: 'test-refresh', isAnonymous: false, expiresAt: Date.now() + 3600000 };
const mockCitizen = { id: 'owner', handle: 'river', display_name: 'River', avatar_form: 'privacy', avatar_mode: 'commons', status: 'active', xp: 0, level: 1, onboarding_completed_at: '2026-10-29T12:00:00Z' };
const mockProfiles = { read: jest.fn(), save: jest.fn() };
const mockStore = { read: jest.fn(), write: jest.fn(), clear: jest.fn(), eraseAccount: jest.fn() };
const mockProjections = { get: jest.fn(), put: jest.fn(), remove: jest.fn(), clearAccount: jest.fn() };
const mockSync = jest.fn();
const mockDeleteAccount = jest.fn();
jest.mock('../auth/account-deletion', () => ({ deleteOwnAccount: (...args: unknown[]) => mockDeleteAccount(...args) }));
const mockAuth = { refreshSession: jest.fn(), signInWithPassword: jest.fn(), signUp: jest.fn() };
let mockResume: ((state: 'active') => void) | undefined;
const mockProviderSession = { access_token: 'refreshed', refresh_token: 'refreshed-token', user: { id: 'owner', is_anonymous: false }, expires_at: Math.floor(Date.now() / 1000) + 3600 };
jest.mock('../api/citizen-profile', () => ({
  ...jest.requireActual('../api/citizen-profile'), CitizenProfiles: jest.fn().mockImplementation(() => mockProfiles),
}));
jest.mock('../api/supabase', () => ({ createSupabaseClient: () => ({ auth: mockAuth }) }));
jest.mock('../config/env', () => ({ readPublicEnv: () => ({ supabaseUrl: 'https://example.test', supabasePublishableKey: 'public' }) }));
jest.mock('../auth/secure-session', () => ({ secureSessionStore: {
  read: () => mockStore.read(), write: (value: unknown) => mockStore.write(value), clear: () => mockStore.clear(), eraseAccount: (id: string) => mockStore.eraseAccount(id),
} }));
jest.mock('../storage/database', () => ({ openNetizensDatabase: async () => ({}) }));
jest.mock('../storage/projections', () => ({ ProjectionStore: jest.fn().mockImplementation(() => mockProjections) }));
jest.mock('../api/netizens-repository', () => ({ NetizensRepository: jest.fn() }));
jest.mock('../sync/outbox', () => ({ Outbox: jest.fn() }));
jest.mock('../sync/reconciler', () => ({ Reconciler: jest.fn().mockImplementation(() => ({ syncOnce: mockSync, whenIdle: async () => {} })) }));

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, handler) => {
    mockResume = handler; return { remove: jest.fn() };
  });
  mockAuth.refreshSession.mockResolvedValue({ data: { session: mockProviderSession }, error: null });
  mockStore.read.mockResolvedValue(mockSession);
  mockProfiles.read.mockResolvedValue(mockCitizen);
  mockProjections.get.mockResolvedValue(null);
  mockSync.mockResolvedValue({ applied: false });
});
const open = () => render(<RuntimeProvider><Text>Protected World</Text></RuntimeProvider>);

it('opens World only after a completed current Citizen profile is read', async () => {
  open();
  expect(screen.queryByText('Protected World')).toBeNull();
  await screen.findByText('Protected World');
  expect(mockProfiles.read).toHaveBeenCalled();
});
it('holds a missing profile at explicit onboarding and waits for server completion', async () => {
  mockProfiles.read.mockResolvedValue(null);
  mockProfiles.save.mockResolvedValue(mockCitizen);
  open();
  await screen.findByText('Become a Citizen');
  expect(screen.queryByText('Protected World')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Citizen handle'), 'river');
  fireEvent.changeText(screen.getByLabelText('Display name'), 'River');
  fireEvent.press(screen.getByText('Enter NETIZENS'));
  await screen.findByText('Protected World');
  expect(mockProfiles.save).toHaveBeenCalledWith({ handle: 'river', display_name: 'River', avatar_form: 'privacy', avatar_mode: 'commons' });
});
it('does not infer a missing Citizen from a failed profile request', async () => {
  mockProfiles.read.mockRejectedValue(new Error('offline'));
  open();
  await screen.findByText('Retry account verification');
  expect(screen.queryByText('Protected World')).toBeNull();
  expect(screen.queryByText('Become a Citizen')).toBeNull();
});
it('restores a previously completed own identity for offline cached public reads', async () => {
  mockProfiles.read.mockRejectedValue(new Error('offline'));
  mockProjections.get.mockResolvedValue({ body: mockCitizen });
  open();
  await screen.findByText('Protected World');
});
it('rejects another account cached identity', async () => {
  mockProfiles.read.mockRejectedValue(new Error('offline'));
  mockProjections.get.mockResolvedValue({ body: { ...mockCitizen, id: 'other' } });
  open();
  await screen.findByText('Retry account verification');
  expect(screen.queryByText('Protected World')).toBeNull();
});
it('does not run queued social mutations for a restricted Citizen', async () => {
  mockProfiles.read.mockResolvedValue({ ...mockCitizen, status: 'suspended' });
  open();
  await screen.findByText('This account cannot enter World. Contact the NETIZENS operator for account support.');
  expect(mockSync).not.toHaveBeenCalled();
});
it('purges the account-scoped projection and outbox on sign out', async () => {
  mockProfiles.read.mockResolvedValue(null);
  open();
  await screen.findByText('Become a Citizen');
  fireEvent.press(screen.getByText('Sign out'));
  await waitFor(() => expect(mockProjections.clearAccount).toHaveBeenCalledTimes(1));
  expect(mockStore.clear).toHaveBeenCalledTimes(1);
});

it('keeps an email-confirmation signup outside the authenticated World', async () => {
  mockStore.read.mockResolvedValue(null);
  mockAuth.signUp.mockResolvedValue({ data: { session: null, user: { id: 'new-owner' } }, error: null });
  open();
  await screen.findByText('Sign in');
  fireEvent.changeText(screen.getByLabelText('Email'), ' citizen@example.test ');
  fireEvent.changeText(screen.getByLabelText('Password'), 'a-long-new-password');
  fireEvent.press(screen.getByText('Create Citizen account'));
  await screen.findByText('Check your email to confirm your account, then return here to sign in.');
  expect(mockAuth.signUp).toHaveBeenCalledWith({ email: 'citizen@example.test', password: 'a-long-new-password' });
  expect(mockStore.write).not.toHaveBeenCalled();
  expect(screen.queryByText('Protected World')).toBeNull();
});
it('validates new credentials before requesting signup', async () => {
  mockStore.read.mockResolvedValue(null);
  open();
  await screen.findByText('Sign in');
  fireEvent.changeText(screen.getByLabelText('Email'), 'invalid');
  fireEvent.changeText(screen.getByLabelText('Password'), 'short');
  fireEvent.press(screen.getByText('Create Citizen account'));
  await screen.findByText('Enter a valid email and a password of at least 12 characters.');
  expect(mockAuth.signUp).not.toHaveBeenCalled();
});

it('does not overwrite completed onboarding with an older profile refresh', async () => {
  const incomplete = { ...mockCitizen, onboarding_completed_at: null };
  mockProfiles.read.mockResolvedValueOnce(incomplete);
  mockProfiles.save.mockResolvedValue(mockCitizen);
  open();
  await screen.findByText('Become a Citizen');
  let finish!: (value: unknown) => void;
  mockProfiles.read.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  act(() => mockResume?.('active'));
  await waitFor(() => expect(mockProfiles.read).toHaveBeenCalledTimes(2));
  fireEvent.changeText(screen.getByLabelText('Citizen handle'), 'river');
  fireEvent.changeText(screen.getByLabelText('Display name'), 'River');
  fireEvent.press(screen.getByText('Enter NETIZENS'));
  await screen.findByText('Protected World');
  await act(async () => { finish(incomplete); });
  expect(screen.getByText('Protected World')).toBeTruthy();
});

it('a retired retry session cannot overwrite credentials after its refresh returns', async () => {
  mockProfiles.read.mockRejectedValue(new Error('offline'));
  let finish!: (value: unknown) => void;
  mockAuth.refreshSession.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  open();
  await screen.findByText('Retry account verification');
  act(() => mockResume?.('active'));
  await waitFor(() => expect(mockAuth.refreshSession).toHaveBeenCalledTimes(1));
  fireEvent.press(screen.getByText('Retry account verification'));
  await waitFor(() => expect(mockProfiles.read).toHaveBeenCalledTimes(2));
  await act(async () => { finish({ data: { session: mockProviderSession }, error: null }); });
  expect(mockStore.write).not.toHaveBeenCalled();
});

function DeletionAction() {
  const runtime = useRuntime();
  return <Button title="Test account deletion" onPress={() => void runtime.deleteAccount('citizen@example.test', 'password', 'DELETE').catch(() => undefined)} />;
}
it('purges local credentials and account data only after canonical deletion confirmation', async () => {
  mockDeleteAccount.mockImplementation(async () => { mockStore.read.mockResolvedValue(null); });
  render(<RuntimeProvider><DeletionAction /></RuntimeProvider>);
  await screen.findByText('Test account deletion');
  fireEvent.press(screen.getByText('Test account deletion'));
  await waitFor(() => expect(mockProjections.clearAccount).toHaveBeenCalledTimes(1));
  expect(mockDeleteAccount).toHaveBeenCalledTimes(1); expect(mockStore.clear).toHaveBeenCalledTimes(1);
  await screen.findByText('Sign in');
});
it('does not erase local state or show deletion success if canonical deletion fails', async () => {
  mockDeleteAccount.mockRejectedValue(new Error('unconfirmed'));
  render(<RuntimeProvider><DeletionAction /></RuntimeProvider>);
  await screen.findByText('Test account deletion');
  fireEvent.press(screen.getByText('Test account deletion'));
  await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
  expect(mockStore.clear).not.toHaveBeenCalled(); expect(mockProjections.clearAccount).not.toHaveBeenCalled();
  expect(screen.getByText('Test account deletion')).toBeTruthy();
});

it('confirmed deletion after retrying account verification still purges only the retired account', async () => {
  mockProfiles.read.mockRejectedValue(new Error('offline'));
  let confirm!: () => void;
  mockDeleteAccount.mockImplementation(() => new Promise<void>(resolve => { confirm = resolve; }));
  open(); await screen.findByText('Retry account verification');
  fireEvent.press(screen.getByText('Delete account'));
  fireEvent.changeText(screen.getByLabelText('Account email'), 'citizen@example.test');
  fireEvent.changeText(screen.getByLabelText('Current password'), 'password');
  fireEvent.changeText(screen.getByLabelText('Confirm permanent deletion'), 'DELETE');
  fireEvent.press(screen.getByText('Permanently delete account'));
  await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
  fireEvent.press(screen.getByText('Retry account verification'));
  await waitFor(() => expect(mockProfiles.read).toHaveBeenCalledTimes(2));
  await act(async () => confirm());
  await waitFor(() => expect(mockProjections.clearAccount).toHaveBeenCalledTimes(1));
  expect(mockStore.eraseAccount).toHaveBeenCalledWith('owner');
  expect(mockStore.clear).not.toHaveBeenCalled();
});
