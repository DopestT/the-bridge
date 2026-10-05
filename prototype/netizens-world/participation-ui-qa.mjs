import fs from "node:fs";
import assert from "node:assert/strict";

const moduleUrl=new URL("./participation-ui.js",import.meta.url);
const styleUrl=new URL("./participation.css",import.meta.url);
assert.ok(fs.existsSync(moduleUrl),"participation UI should live in a dedicated app module");
assert.ok(fs.existsSync(styleUrl),"participation styles should stay isolated from the critical shell stylesheet");

const ui=fs.readFileSync(moduleUrl,"utf8");
const html=fs.readFileSync(new URL("./index.html",import.meta.url),"utf8");
const css=fs.readFileSync(styleUrl,"utf8");
const app=fs.readFileSync(new URL("./app.js",import.meta.url),"utf8");

for(const marker of [
  "function renderEntityDiscussion",
  "data.listDiscussion(entity.id)",
  "data-discussion-compose",
  "data-discussion-reply",
  "data.createDiscussionItem",
  "entity-discussion",
  "discussion-composer"
]){
  assert.ok(ui.includes(marker),`entity participation UI missing marker: ${marker}`);
}

assert.ok(
  ui.includes('entity.placeId==="circles"') && ui.includes("PRIVATE CONVERSATION"),
  "Circles must use a private-conversation boundary instead of public entity discussion"
);
assert.ok(
  ui.includes("moderationState") && ui.includes("MODERATED"),
  "discussion UI must tolerate moderated parents without exposing removed content"
);
assert.ok(
  ui.includes("provenance") && ui.includes("SEEDED") && ui.includes("DEMO"),
  "seeded/demo discussion must be visibly labeled rather than presented as genuine activity"
);
assert.ok(
  ui.includes('provenance:"genuine"'),
  "interactive discussion creation must explicitly record genuine provenance"
);

assert.ok(html.includes('id="openNotifications"'),"World app shell needs a notification entry point");
assert.ok(html.includes('id="notificationPanel"'),"World app shell needs a compact notification panel");
assert.ok(html.includes('src="./participation-ui.js"'),"app shell must load the participation module");
assert.ok(html.includes('href="./participation.css"'),"app shell must load participation styles");
assert.ok(ui.includes("data.listNotifications()"),"notification panel must use the shared notification API");
assert.ok(ui.includes("data.markNotificationRead"),"notification panel must support marking owned notifications read");
assert.ok(ui.includes("data-notification-read"),"notification items need a bounded read action");

for(const selector of [".entity-discussion",".discussion-item",".discussion-composer",".notification-list"]){
  assert.ok(css.includes(selector),`participation UI style missing: ${selector}`);
}

assert.ok(!ui.includes("thread_members") && !ui.includes("conversation_threads"),"public entity UI must not query private thread storage directly");
assert.ok(!app.includes("thread_members") && !app.includes("conversation_threads"),"core World shell must not query private thread storage directly");

console.log("NETIZENS participatory entity UI contract QA passed");