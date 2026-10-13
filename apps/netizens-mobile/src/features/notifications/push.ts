import * as Notifications from "expo-notifications";
// The caller supplies an authenticated registration endpoint. Never silently
// claim success if the server cannot retain a token for this Citizen.
export async function requestPushPermission(
  reason: "joined-space" | "conversation-updates",
  projectId: string,
  register: (token: string) => Promise<void>,
) {
  if (!["joined-space", "conversation-updates"].includes(reason) || !projectId)
    throw new Error("Context and project required");
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return false;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  await register(token.data);
  return true;
}
