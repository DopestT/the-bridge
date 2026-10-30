import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MessagesScreen } from './MessagesScreen';
const mockPush = jest.fn();
const mockRepository = { threads: jest.fn(), conversationRequests: jest.fn(), requestConversation: jest.fn(), respondConversationRequest: jest.fn(), blockCitizen: jest.fn() };
const mockRuntime = { repository: mockRepository, revision: 0, userId: 'me' };
jest.mock('../../runtime/RuntimeProvider', () => ({ useRuntime: () => mockRuntime }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
const incoming = { id: 'request', requester_id: 'other', recipient_id: 'me', status: 'pending', requester: { handle: 'river' }, recipient: { handle: 'me' } };
beforeEach(() => {
  jest.clearAllMocks(); mockRepository.threads.mockResolvedValue([]); mockRepository.conversationRequests.mockResolvedValue([]);
});
it('requests a conversation without pretending it is an accepted thread', async () => {
  mockRepository.requestConversation.mockResolvedValue({ request_id: 'request', status: 'pending', thread_id: null });
  render(<MessagesScreen />);
  fireEvent.changeText(screen.getByLabelText('Citizen handle'), '@River');
  fireEvent.press(screen.getByText('Request conversation'));
  await screen.findByText('Invitation pending. Messages unlock after acceptance.');
  expect(mockRepository.requestConversation).toHaveBeenCalledWith('river');
  expect(mockPush).not.toHaveBeenCalled();
});
it('opens only the canonical thread after the recipient accepts', async () => {
  mockRepository.conversationRequests.mockResolvedValue([incoming]);
  mockRepository.respondConversationRequest.mockResolvedValue({ request_id: 'request', status: 'accepted', thread_id: 'thread' });
  render(<MessagesScreen />);
  await screen.findByText('From @river');
  fireEvent.press(screen.getByText('Accept'));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/messages/thread'));
  expect(mockRepository.respondConversationRequest).toHaveBeenCalledWith('request', 'accept');
});
it('keeps a denied invitation visible and never navigates', async () => {
  mockRepository.conversationRequests.mockResolvedValue([incoming]);
  mockRepository.respondConversationRequest.mockRejectedValue(new Error('denied'));
  render(<MessagesScreen />);
  await screen.findByText('From @river');
  fireEvent.press(screen.getByText('Accept'));
  await screen.findByText('Could not update this invitation. Refresh and try again.');
  expect(screen.getByText('From @river')).toBeTruthy(); expect(mockPush).not.toHaveBeenCalled();
});
it('lets a sender cancel without offering self-acceptance', async () => {
  mockRepository.conversationRequests.mockResolvedValue([{ ...incoming, requester_id: 'me', recipient_id: 'other', recipient: { handle: 'river' } }]);
  mockRepository.respondConversationRequest.mockResolvedValue({ request_id: 'request', status: 'cancelled', thread_id: null });
  render(<MessagesScreen />);
  await screen.findByText('To @river');
  expect(screen.queryByText('Accept')).toBeNull();
  fireEvent.press(screen.getByText('Cancel invitation'));
  await screen.findByText('Invitation cancelled.');
});
it('declines explicitly and does not open a conversation', async () => {
  mockRepository.conversationRequests.mockResolvedValue([incoming]);
  mockRepository.respondConversationRequest.mockResolvedValue({ request_id: 'request', status: 'declined', thread_id: null });
  render(<MessagesScreen />); await screen.findByText('From @river');
  fireEvent.press(screen.getByText('Decline')); await screen.findByText('Invitation declined.');
  expect(mockPush).not.toHaveBeenCalled();
});
it('preserves existing conversations if invitation reads fail', async () => {
  mockRepository.threads.mockResolvedValue([{ id: 'existing', title: 'Existing friends' }]);
  mockRepository.conversationRequests.mockRejectedValue(new Error('offline'));
  render(<MessagesScreen />); await screen.findByText('Existing friends');
  await screen.findByText('Conversation requests unavailable. Reconnect to refresh.');
});
it('a failed send never displays an invitation confirmation', async () => {
  mockRepository.requestConversation.mockRejectedValue(new Error('offline'));
  render(<MessagesScreen />);
  fireEvent.changeText(screen.getByLabelText('Citizen handle'), 'river');
  fireEvent.press(screen.getByText('Request conversation'));
  await screen.findByText('Invitation not confirmed. Check the handle, connection or contact permissions.');
  expect(screen.queryByText('Invitation pending. Messages unlock after acceptance.')).toBeNull();
});
it('blocks an incoming inviter only after server confirmation', async () => {
  mockRepository.conversationRequests.mockResolvedValueOnce([incoming]).mockResolvedValue([]);
  mockRepository.blockCitizen.mockResolvedValue(undefined);
  render(<MessagesScreen />); await screen.findByText('From @river');
  fireEvent.press(screen.getByText('Block Citizen')); await screen.findByText('Citizen blocked.');
  expect(mockRepository.blockCitizen).toHaveBeenCalledWith('other');
  expect(screen.queryByText('From @river')).toBeNull();
});
it('does not hide an invitation when blocking fails', async () => {
  mockRepository.conversationRequests.mockResolvedValue([incoming]);
  mockRepository.blockCitizen.mockRejectedValue(new Error('offline'));
  render(<MessagesScreen />); await screen.findByText('From @river');
  fireEvent.press(screen.getByText('Block Citizen'));
  await screen.findByText('Could not block this Citizen. Try again when connected.');
  expect(screen.getByText('From @river')).toBeTruthy(); expect(screen.queryByText('Citizen blocked.')).toBeNull();
});
