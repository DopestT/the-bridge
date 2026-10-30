import { CitizenProfiles, validateProfile } from './citizen-profile';

const citizen = { id: 'owner', handle: 'river', display_name: 'River', avatar_form: 'privacy', avatar_mode: 'commons', status: 'active', xp: 0, level: 1, onboarding_completed_at: '2026-10-29T12:00:00Z' };
const input = { handle: ' RIVER ', display_name: ' River ', avatar_form: 'privacy', avatar_mode: 'commons' } as const;
function setup(response: Response) {
  const fetcher = jest.fn().mockResolvedValue(response);
  return { fetcher, profiles: new CitizenProfiles({ supabaseUrl: 'https://example.test', supabasePublishableKey: 'public' }, () => ({ userId: 'owner', accessToken: 'session' }), fetcher) };
}
it('sends normalized editable fields only to the self-profile RPC', async () => {
  const { fetcher, profiles } = setup(new Response(JSON.stringify([citizen])));
  expect(await profiles.save(input)).toEqual(citizen);
  const [url, init] = fetcher.mock.calls[0];
  expect(url).toBe('https://example.test/rest/v1/rpc/complete_citizen_profile');
  expect(JSON.parse(init.body)).toEqual({ p_handle: 'river', p_display_name: 'River', p_avatar_form: 'privacy', p_avatar_mode: 'commons' });
  expect(init.headers.Authorization).toBe('Bearer session');
});
it('does not interpret a handle conflict as saved', async () => {
  const { profiles } = setup(new Response(JSON.stringify({ code: '23505' }), { status: 409 }));
  await expect(profiles.save(input)).rejects.toThrow('This handle is unavailable.');
});
it.each([ { rows: [] }, { rows: [{ ...citizen, onboarding_completed_at: null }] }, { rows: [{ ...citizen, id: 'other' }] } ])('rejects unconfirmed completion %j', async ({ rows }) => {
  const { profiles } = setup(new Response(JSON.stringify(rows)));
  await expect(profiles.save(input)).rejects.toThrow();
});
it('validates form fields without permitting wildcard handles', () => {
  expect(validateProfile(input).handle).toBe('river');
  expect(() => validateProfile({ ...input, handle: 'ab' })).toThrow();
  expect(() => validateProfile({ ...input, handle: 'invalid%' })).toThrow();
});
