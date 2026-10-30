import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SearchRoute from '../../../app/search';
const mockPush = jest.fn();
const mockRepository = { searchEntities: jest.fn() };
jest.mock('../../runtime/RuntimeProvider', () => ({ useRuntime: () => ({ repository: mockRepository }) }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
beforeEach(() => jest.clearAllMocks());

it('searches a submitted title and opens the real returned entity', async () => {
  mockRepository.searchEntities.mockResolvedValue([{ id: 'crew-1', title: 'Garden Crew', place_id: 'crews', summary: 'Meet locally' }]);
  render(<SearchRoute />);
  expect(mockRepository.searchEntities).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('Search space titles'), 'Garden');
  fireEvent.press(screen.getByLabelText('Find spaces'));
  await screen.findByText('Garden Crew');
  expect(mockRepository.searchEntities).toHaveBeenCalledWith('Garden');
  fireEvent.press(screen.getByText('Garden Crew'));
  expect(mockPush).toHaveBeenCalledWith('/entity/crew-1');
});

it('shows a connection error rather than pretending there are no results', async () => {
  mockRepository.searchEntities.mockRejectedValue(new Error('offline'));
  render(<SearchRoute />);
  fireEvent.changeText(screen.getByLabelText('Search space titles'), 'Garden');
  fireEvent.press(screen.getByLabelText('Find spaces'));
  await screen.findByText('Search unavailable. Check your connection and try again.');
  expect(screen.queryByText('No accessible spaces match this title.')).toBeNull();
});

it('ignores an older search response after the query changes', async () => {
  let resolve!: (rows: unknown[]) => void;
  mockRepository.searchEntities.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  render(<SearchRoute />);
  fireEvent.changeText(screen.getByLabelText('Search space titles'), 'Old');
  fireEvent.press(screen.getByLabelText('Find spaces'));
  await waitFor(() => expect(mockRepository.searchEntities).toHaveBeenCalledWith('Old'));
  fireEvent.changeText(screen.getByLabelText('Search space titles'), 'New');
  resolve([{ id: 'old', title: 'Old private result' }]);
  await waitFor(() => expect(screen.queryByText('Searching…')).toBeNull());
  expect(screen.queryByText('Old private result')).toBeNull();
});
