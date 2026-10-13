import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { ThreadScreen } from "./ThreadScreen";
const mockRepository = { thread: jest.fn(), messages: jest.fn() };
const mockOutbox = {
  enqueue: jest.fn(),
  list: jest.fn().mockResolvedValue([]),
};
const mockRuntime = {
  repository: mockRepository,
  outbox: mockOutbox,
  revision: 0,
  sync: jest.fn(),
};
jest.mock("../../runtime/RuntimeProvider", () => ({
  useRuntime: () => mockRuntime,
}));
beforeEach(() => jest.clearAllMocks());
it("denied private link never reads messages or shows a composer", async () => {
  mockRepository.thread.mockResolvedValue(null);
  render(<ThreadScreen threadId="private" />);
  await screen.findByText(
    "This conversation is unavailable or you do not have access.",
  );
  expect(mockRepository.messages).not.toHaveBeenCalled();
  expect(mockOutbox.list).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Private message")).toBeNull();
});
it("restores durable unconfirmed sends and retries without enqueueing a second message", async () => {
  mockRepository.thread.mockResolvedValue({ id: "thread", title: "Friends" });
  mockRepository.messages.mockResolvedValue([]);
  mockOutbox.list.mockResolvedValue([
    {
      mutationId: "durable",
      kind: "message.send",
      payload: { body: "hello", threadId: "thread" },
      status: "queued",
    },
  ]);
  const rendered = render(<ThreadScreen threadId="thread" />);
  await screen.findByText("Pending delivery — saved on this device");
  rendered.unmount();
  render(<ThreadScreen threadId="thread" />);
  await screen.findByText("hello");
  fireEvent.press(screen.getByText("Retry pending messages"));
  await waitFor(() => expect(mockRuntime.sync).toHaveBeenCalled());
  expect(mockOutbox.enqueue).not.toHaveBeenCalled();
});
