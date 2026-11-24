import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("./index.html");
const app = read("./app.js");
const presence = read("./world-presence.js");

assert.ok(html.includes('id="worldPresenceLayer"'), "World includes a dot layer");
assert.ok(html.includes('id="worldPresenceStatus"'), "World displays whether live presence is connected");
assert.ok(html.includes('id="presenceIdentity"'), "Explicit identity-sharing setting");
assert.ok(html.includes('id="presenceFollow" disabled'), "Following starts disabled");
assert.ok(html.includes('./world-presence.js'), "Privacy module loads before World app");

assert.match(presence, /identityVisible:false, followMovement:false/, "Consent defaults private");
assert.match(presence, /settings\.followMovement=settings\.identityVisible && followToggle\.checked===true/, "Following requires identity consent");
assert.match(presence, /if\(!settings\.identityVisible\) settings\.followMovement=false/, "Identity revocation also revokes follow");
assert.match(presence, /livePresenceConnected:false/, "Never invent live users or a connected feed");
assert.match(presence, /currentPlace=place/, "Current browser visitor moves to selected World Place");
assert.doesNotMatch(presence, /navigator\.geolocation|watchPosition|WebSocket|EventSource|fetch\(|sendBeacon\(/, "No physical location or network presence requests");
assert.match(app, /!worldPresence\.previewState\(\)\.livePresenceConnected \|\| !worldPresence\.mayShareMovement\(\)/, "Place telemetry blocked until server connection AND explicit consent");
assert.match(app, /netizens:entity-view/, "Entity UI event remains local while analytics are private");
assert.match(app, /if\(!worldPresence \|\| !worldPresence\.previewState\(\)\.livePresenceConnected \|\| !worldPresence\.mayShareMovement\(\)\) return;/, "All outbound-style analytics suppressed without consent and live service");

assert.match(app, /worldPresence\.travelTo\(p\.dataset\.place/, "World clicks animate this browser's dot");
console.log("NETIZENS World presence privacy contract checks passed");
