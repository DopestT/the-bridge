import assert from "node:assert/strict";
import fs from "node:fs";
const read=file=>fs.readFileSync(new URL(file,import.meta.url),"utf8");
const secrets=read("./world-secrets.js");
const app=read("./app.js");
const html=read("./index.html");
const presence=read("./world-presence.js");
const expected=["commons","crews","local","projects","ask","exchange","circles","events","plans","yesno"];
for(const id of expected){
 assert.match(secrets,new RegExp("\\b"+id+":\\{symbol:"),"Unique secret in "+id);
}
assert.match(secrets,/found\.add\(place\)/,"Secrets record first visit");
assert.match(secrets,/found\.size===ids\.length/,"All-secret ending exists");
assert.match(secrets,/previousFocus\.focus\(\)/,"Focus returned after secret dialog");
assert.match(secrets,/localStorage\.setItem\(STORAGE/,"Browser-local collection");
assert.match(secrets,/Object\.hasOwn\(SIGNALS/,"Invalid place cannot unlock a signal");
assert.doesNotMatch(secrets,/fetch\(|WebSocket|sendBeacon|XMLHttpRequest|geolocation/,"No network or physical location from secrets");
assert.match(html,/id="worldSecretDialog"/,"Accessible reveal dialog exists");
assert.match(html,/aria-labelledby="worldSecretTitle"/,"Dialog labelled");
assert.match(html,/id="worldSecretCollection"/,"Local progress collection exists");
assert.match(app,/NetizensWorldSecrets\.mountPlace\(id,placeView\)/,"Every virtual Place renders a secret");
assert.match(presence,/const DEMO_ROUTES = \[/,"Demo routes declared");
const routes=presence.split("const DEMO_ROUTES = [")[1].split("  ];")[0].split("\n").filter(line=>line.trim().startsWith("["));
assert.equal(routes.length,4,"Exactly four synthetic dot bot routes");
assert.match(presence,/SIMULATED DOT BOTS/,"Honest simulation disclosure");
assert.match(presence,/stopDemoBots\(\)/,"Bots are cleaned up on navigation or exit");
assert.match(presence,/hasReducedMotion\(\)/,"Reduced-motion support");
assert.match(presence,/livePresenceConnected:false/,"No false live multiuser connection");
console.log("NETIZENS 4 synthetic dots + 10 secret signals: static contract QA passed");
