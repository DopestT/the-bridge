import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccountDeletion } from './AccountDeletion';
it('warns about owned spaces and requires explicit confirmation', async () => {
  const remove = jest.fn(); render(<AccountDeletion onDelete={remove} />);
  fireEvent.press(screen.getByText('Delete account'));
  expect(screen.getByText(/Owned spaces and conversations/)).toBeTruthy();
  expect(screen.getByLabelText('Confirm permanent deletion').props.value).toBe('');
  fireEvent.press(screen.getByText('Permanently delete account'));
  expect(remove).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Keep account'));
  expect(screen.queryByLabelText('Current password')).toBeNull();
});
it('does not show success or clear account on a failed deletion', async () => {
  const remove = jest.fn().mockRejectedValue(new Error('offline'));
  render(<AccountDeletion onDelete={remove} />); fireEvent.press(screen.getByText('Delete account'));
  fireEvent.changeText(screen.getByLabelText('Account email'), 'citizen@example.test');
  fireEvent.changeText(screen.getByLabelText('Current password'), 'password');
  fireEvent.changeText(screen.getByLabelText('Confirm permanent deletion'), 'DELETE');
  fireEvent.press(screen.getByText('Permanently delete account'));
  await screen.findByText('Deletion was not confirmed. Sign in again to check your account before retrying.');
  await waitFor(() => expect(remove).toHaveBeenCalledWith('citizen@example.test', 'password', 'DELETE'));
});
