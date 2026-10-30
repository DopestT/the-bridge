import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import { EntityScreen } from "./EntityScreen";
const mockRepository = {
  entity: jest.fn(),
  discussions: jest.fn(),
  membership: jest.fn(),
  children: jest.fn(),
  threadForEntity: jest.fn(),
  castVote: jest.fn(),
};
const mockRuntime = {
  repository: mockRepository,
  revision: 0,
  projections: {
    get: jest.fn().mockResolvedValue(null),
    put: jest.fn(),
    remove: jest.fn(),
  },
  outbox: { enqueue: jest.fn(), list: jest.fn().mockResolvedValue([]) },
  sync: jest.fn(),
};
jest.mock("../../runtime/RuntimeProvider", () => ({
  useRuntime: () => mockRuntime,
}));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
beforeEach(() => {
  jest.clearAllMocks();
  mockRepository.membership.mockResolvedValue(null);
  mockRepository.children.mockResolvedValue([]);
  mockRepository.threadForEntity.mockResolvedValue(null);
  mockRuntime.projections.get.mockResolvedValue(null);
  mockRuntime.outbox.list.mockResolvedValue([]);
  mockRepository.discussions.mockResolvedValue([]);
});
it("never opens public participation for a Circle", async () => {
  mockRepository.entity.mockResolvedValue({
    id: "circle",
    place_id: "circles",
    title: "Private Circle",
    visibility: "private",
  });
  render(<EntityScreen entityId="circle" />);
  await screen.findByText("Open Messages");
  expect(mockRepository.discussions).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Write a post")).toBeNull();
});
it("renders unauthorized entity without retaining a private body", async () => {
  mockRepository.entity.mockResolvedValue(null);
  render(<EntityScreen entityId="denied" />);
  await screen.findByText(
    "This space is unavailable or you do not have access.",
  );
  expect(screen.queryByLabelText("Write a post")).toBeNull();
});
it("shows a queued post as pending rather than published", async () => {
  mockRepository.entity.mockResolvedValue({
    id: "crew",
    place_id: "crews",
    title: "Our Crew",
    visibility: "public",
  });
  mockRuntime.outbox.list.mockResolvedValue([
    {
      status: "queued",
      mutationId: "mutation",
      kind: "discussion.post",
      payload: { body: "hello", entityId: "crew" },
    },
  ]);
  mockRuntime.outbox.enqueue.mockResolvedValue({
    mutationId: "mutation",
    kind: "discussion.post",
    payload: { body: "hello", entityId: "crew" },
  });
  render(<EntityScreen entityId="crew" />);
  await screen.findByLabelText("Write a post");
  fireEvent.changeText(screen.getByLabelText("Write a post"), "hello");
  fireEvent.press(screen.getByText("Post"));
  await waitFor(() =>
    expect(screen.getByText("Pending — saved on this device")).toBeTruthy(),
  );
});
it("uses a public cached entity during an offline refresh", async () => {
  mockRuntime.projections.get.mockResolvedValue({
    body: {
      id: "crew",
      place_id: "crews",
      title: "Cached Crew",
      visibility: "public",
    },
    state: "canonical",
  });
  mockRepository.entity.mockRejectedValue(new Error("offline"));
  render(<EntityScreen entityId="crew" />);
  await screen.findByText("Cached Crew");
});
it("never renders a cached private body before authorization", async () => {
  mockRuntime.projections.get.mockResolvedValue({
    body: {
      id: "secret",
      place_id: "crews",
      title: "Secret title",
      visibility: "private",
    },
    state: "canonical",
  });
  mockRepository.entity.mockResolvedValue(null);
  render(<EntityScreen entityId="secret" />);
  await screen.findByText(
    "This space is unavailable or you do not have access.",
  );
  expect(screen.queryByText("Secret title")).toBeNull();
});

it("opens an accessible nested entity and its parent using stable IDs", async () => {
  mockRepository.entity.mockResolvedValue({ id: "project", title: "Project", place_id: "projects", visibility: "public", parent_entity_id: "crew-parent" });
  mockRepository.children.mockResolvedValue([{ id: "plan-child", title: "Launch plan", place_id: "plans", visibility: "public", parent_entity_id: "project" }]);
  render(<EntityScreen entityId="project" />);
  await screen.findByText("Launch plan");
  fireEvent.press(screen.getByText("Launch plan"));
  expect(mockPush).toHaveBeenCalledWith("/entity/plan-child");
  fireEvent.press(screen.getByText("Open parent space"));
  expect(mockPush).toHaveBeenCalledWith("/entity/crew-parent");
  expect(mockRepository.children).toHaveBeenCalledWith("project", 0);
});

it("does not read child entities before the parent is authorized", async () => {
  mockRepository.entity.mockResolvedValue(null);
  render(<EntityScreen entityId="denied-parent" />);
  await screen.findByText("This space is unavailable or you do not have access.");
  expect(mockRepository.children).not.toHaveBeenCalled();
});

it("never shows private or Circle children from a cached list", async () => {
  mockRuntime.projections.get.mockImplementation(async (collection, key) => key.startsWith("children:") ? { body: [
    { id: "private", title: "Cached secret", visibility: "private", place_id: "crews" },
    { id: "circle", title: "Cached Circle", visibility: "public", place_id: "circles" },
    { id: "public", title: "Cached public child", visibility: "public", place_id: "plans" },
  ] } : null);
  mockRepository.entity.mockResolvedValue({ id: "parent", title: "Parent", place_id: "projects", visibility: "public" });
  mockRepository.children.mockRejectedValue(new Error("offline"));
  render(<EntityScreen entityId="parent" />);
  await screen.findByText("Cached public child");
  expect(screen.queryByText("Cached secret")).toBeNull();
  expect(screen.queryByText("Cached Circle")).toBeNull();
});

it("opens a Circle's existing authorized conversation instead of the generic inbox", async () => {
  mockRepository.entity.mockResolvedValue({ id: "circle", title: "Circle", place_id: "circles", visibility: "private" });
  mockRepository.threadForEntity.mockResolvedValue({ id: "circle-thread", kind: "entity" });
  render(<EntityScreen entityId="circle" />);
  await screen.findByText("Open Messages");
  fireEvent.press(screen.getByText("Open Messages"));
  await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/messages/circle-thread"));
  expect(mockRepository.threadForEntity).toHaveBeenCalledWith("circle");
});

it("does not navigate or imply conversation access when a Circle has no visible thread", async () => {
  mockRepository.entity.mockResolvedValue({ id: "circle", title: "Circle", place_id: "circles", visibility: "private" });
  mockRepository.threadForEntity.mockResolvedValue(null);
  render(<EntityScreen entityId="circle" />);
  await screen.findByText("Open Messages");
  fireEvent.press(screen.getByText("Open Messages"));
  await screen.findByText("No conversation is available for this Circle, or you do not have access.");
  expect(mockPush).not.toHaveBeenCalled();
});

it("reveals community-question counts only after a confirmed vote", async () => {
  mockRepository.entity.mockResolvedValue({ id: "question", title: "Meet Saturday?", place_id: "yesno", visibility: "public" });
  mockRepository.castVote.mockResolvedValue({ yes_count: 3, no_count: 1, user_choice: "yes" });
  render(<EntityScreen entityId="question" />);
  await screen.findByText("Choose an answer to see the results.");
  expect(screen.queryByText("Yes: 3 · No: 1")).toBeNull();
  fireEvent.press(screen.getByLabelText("Vote Yes"));
  await screen.findByText("Yes: 3 · No: 1");
  expect(mockRepository.castVote).toHaveBeenCalledWith("question", "yes");
});

it("retains vote-first state when the vote is denied", async () => {
  mockRepository.entity.mockResolvedValue({ id: "question", title: "Meet Saturday?", place_id: "yesno", visibility: "public" });
  mockRepository.castVote.mockRejectedValue(new Error("denied"));
  render(<EntityScreen entityId="question" />);
  await screen.findByText("Choose an answer to see the results.");
  fireEvent.press(screen.getByLabelText("Vote No"));
  await screen.findByText("Your vote was not confirmed. Reconnect and try again.");
  expect(screen.queryByText(/Yes: \d/)).toBeNull();
});
