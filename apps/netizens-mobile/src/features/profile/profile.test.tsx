import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Profile from '../../../app/profile';

const mockSave = jest.fn();
const mockLogout = jest.fn();
const mockCitizen = { id: 'citizen', handle: 'river', display_name: 'River', avatar_form: 'privacy', avatar_mode: 'commons', status: 'active', xp: 12, level: 2, onboarding_completed_at: '2026-10-29T12:00:00Z' };
jest.mock('../../runtime/RuntimeProvider', () => ({
  useRuntime: () => ({ citizen: mockCitizen, saveProfile: mockSave, logout: mockLogout }),
}));

beforeEach(() => { jest.clearAllMocks(); });

it('renders the canonical Citizen rather than a profile placeholder', () => {
  render(<Profile />);
  expect(screen.getByDisplayValue('River')).toBeTruthy();
  expect(screen.getByDisplayValue('river')).toBeTruthy();
  expect(screen.getByText('Level 2 · 12 XP')).toBeTruthy();
});

it('persists only editable profile fields and acknowledges server success', async () => {
  mockSave.mockResolvedValue({ ...mockCitizen, display_name: 'River Stone' });
  render(<Profile />);
  fireEvent.changeText(screen.getByLabelText('Display name'), 'River Stone');
  fireEvent.press(screen.getByText('Save profile'));
  await waitFor(() => expect(mockSave).toHaveBeenCalledWith({ handle: 'river', display_name: 'River Stone', avatar_form: 'privacy', avatar_mode: 'commons' }));
  await screen.findByText('Profile saved.');
});

it('keeps unsaved edits visible and reports a rejected save', async () => {
  mockSave.mockRejectedValue(new Error('This handle is unavailable.'));
  render(<Profile />);
  fireEvent.changeText(screen.getByLabelText('Citizen handle'), 'taken');
  fireEvent.press(screen.getByText('Save profile'));
  await screen.findByText('This handle is unavailable.');
  expect(screen.queryByText('Profile saved.')).toBeNull();
  expect(screen.getByDisplayValue('taken')).toBeTruthy();
});

it('signs out through account-scoped cleanup', async () => {
  mockLogout.mockResolvedValue(undefined);
  render(<Profile />);
  fireEvent.press(screen.getByText('Sign out'));
  await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
});
