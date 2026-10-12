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
jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
beforeEach(() => {
  jest.clearAllMocks();
  mockRepository.membership.mockResolvedValue(null);
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
