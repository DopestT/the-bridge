import fs from "node:fs";
import assert from "node:assert/strict";

const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");
const html=fs.readFileSync(new URL("./index.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("./styles.css",import.meta.url),"utf8");

for(const marker of [
  "function renderEntityDiscussion",
  "store.listDiscussion(entity.id)",
  "data-discussion-compose",
  "data-discussion-reply",
  "store.createDiscussionItem",
  "entity-discussion",
  "discussion-composer"
]){
  assert.ok(app.includes(marker),`entity participation UI missing marker: ${marker}`);
}

assert.ok(
  app.includes('entity.placeId==="circles"') && app.includes("PRIVATE CONVERSATION"),
  "Circles must use a private-conversation boundary instead of public entity discussion"
);
assert.ok(
  app.includes("moderationState") && app.includes("MODERATED"),
  "discussion UI must tolerate moderated parents without exposing removed content"
);
assert.ok(
  app.includes("provenance") && app.includes("SEEDED") && app.includes("DEMO"),
  "seeded/demo discussion must be visibly labeled rather than presented as genuine activity"
);
assert.ok(
  app.includes("store.setEntityMembership") && app.includes('"genuine"'),
  "interactive membership changes must explicitly use genuine provenance"
);

assert.ok(html.includes('id="openNotifications"'),"World app shell needs a notification entry point");
assert.ok(html.includes('id="notificationPanel"'),"World app shell needs a compact notification panel");
assert.ok(app.includes("store.listNotifications()"),"notification panel must use the shared notification API");
assert.ok(app.includes("store.markNotificationRead"),"notification panel must support marking owned notifications read");
assert.ok(app.includes("data-notification-read"),"notification items need a bounded read action");

for(const selector of [".entity-discussion",".discussion-item",".discussion-composer",".notification-list"]){
  assert.ok(css.includes(selector),`participation UI style missing: ${selector}`);
}

assert.ok(!app.includes("thread_members") && !app.includes("conversation_threads"),"public entity UI must not query private thread storage directly");

console.log("NETIZENS participatory entity UI contract QA passed");