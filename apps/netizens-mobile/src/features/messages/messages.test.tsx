import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { ThreadScreen } from "./ThreadScreen";
const mockRepository = {
  thread: jest.fn(),
  messages: jest.fn(),
  blockCitizen: jest.fn(),
  reportMessage: jest.fn(),
};
const mockOutbox = {
  enqueue: jest.fn(),
  list: jest.fn().mockResolvedValue([]),
};
const mockRuntime = {
  repository: mockRepository,
  outbox: mockOutbox,
  revision: 0,
  sync: jest.fn(),
  userId: "me",
};
jest.mock("../../runtime/RuntimeProvider", () => ({
  useRuntime: () => mockRuntime,
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockOutbox.list.mockResolvedValue([]);
  mockRepository.blockCitizen.mockResolvedValue(undefined);
  mockRepository.reportMessage.mockResolvedValue({ id: "report" });
});
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
it("shows safety controls only on inbound messages and hides a sender after confirmed block", async () => {
  mockRepository.thread.mockResolvedValue({ id: "thread", title: "Friends" });
  mockRepository.messages.mockResolvedValue([
    { id: "mine", thread_id: "thread", sender_id: "me", body: "my note" },
    { id: "theirs", thread_id: "thread", sender_id: "them", body: "incoming" },
  ]);
  render(<ThreadScreen threadId="thread" />);
  await screen.findByText("incoming");
  expect(screen.getAllByText("Block sender")).toHaveLength(1);
  fireEvent.press(screen.getByText("Block sender"));
  await waitFor(() => expect(mockRepository.blockCitizen).toHaveBeenCalledWith("them"));
  await screen.findByText("Citizen blocked. Their messages are hidden here.");
  expect(screen.queryByText("incoming")).toBeNull();
  expect(screen.getByText("my note")).toBeTruthy();
});
it("reports an inbound message with an explicit category and keeps the message visible", async () => {
  mockRepository.thread.mockResolvedValue({ id: "thread", title: "Friends" });
  mockRepository.messages.mockResolvedValue([
    { id: "theirs", thread_id: "thread", sender_id: "them", body: "incoming" },
  ]);
  render(<ThreadScreen threadId="thread" />);
  await screen.findByText("incoming");
  fireEvent.press(screen.getByText("Report message"));
  fireEvent.press(screen.getByText("Harassment"));
  await waitFor(() =>
    expect(mockRepository.reportMessage).toHaveBeenCalledWith(
      "theirs",
      "harassment",
      "",
    ),
  );
  await screen.findByText("Report submitted.");
  expect(screen.getByText("incoming")).toBeTruthy();
});
it("failed block keeps the message visible and does not claim success", async () => {
  mockRepository.thread.mockResolvedValue({ id: "thread", title: "Friends" });
  mockRepository.messages.mockResolvedValue([
    { id: "theirs", thread_id: "thread", sender_id: "them", body: "incoming" },
  ]);
  mockRepository.blockCitizen.mockRejectedValueOnce(new Error("denied"));
  render(<ThreadScreen threadId="thread" />);
  await screen.findByText("incoming");
  fireEvent.press(screen.getByText("Block sender"));
  await screen.findByText("Could not block this Citizen. Try again when connected.");
  expect(screen.getByText("incoming")).toBeTruthy();
  expect(screen.queryByText("Citizen blocked. Their messages are hidden here.")).toBeNull();
});