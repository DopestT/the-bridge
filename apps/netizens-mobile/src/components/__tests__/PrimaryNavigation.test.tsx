import { fireEvent, render, screen } from '@testing-library/react-native';
import { PrimaryNavigation } from '../PrimaryNavigation';
const mockNavigate = jest.fn();
let mockPath = '/world';
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }), usePathname: () => mockPath }));
beforeEach(() => { mockNavigate.mockClear(); mockPath = '/world'; });
it('exposes the current destination as a selected accessible tab', () => {
  render(<PrimaryNavigation />);
  const tabs = screen.getAllByRole('tab');
  expect(tabs).toHaveLength(5);
  expect(screen.getByRole('tab', { name: 'Open World' }).props.accessibilityState.selected).toBe(true);
  expect(screen.getByRole('tab', { name: 'Open Search' }).props.accessibilityState.selected).toBe(false);
});
it('keeps Messages selected inside a conversation and navigates to Search', () => {
  mockPath = '/messages/00000000-0000-4000-8000-000000000001';
  render(<PrimaryNavigation />);
  expect(screen.getByRole('tab', { name: 'Open Messages' }).props.accessibilityState.selected).toBe(true);
  fireEvent.press(screen.getByRole('tab', { name: 'Open Search' }));
  expect(mockNavigate).toHaveBeenCalledWith('/search');
});
it.each(['/place/crews', '/entity/00000000-0000-4000-8000-000000000001'])('keeps World selected for %s', path => {
  mockPath = path; render(<PrimaryNavigation />);
  expect(screen.getByRole('tab', { name: 'Open World' }).props.accessibilityState.selected).toBe(true);
});
