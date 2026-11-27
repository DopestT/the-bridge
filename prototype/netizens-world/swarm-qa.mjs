import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const swarm=require("./swarm.js");
assert.equal(swarm.bots.length,5);
assert.equal(new Set(swarm.bots.map(bot=>bot.id)).size,5);
assert.deepEqual(swarm.bots.map(b=>b.id),["world-architect","citizen-engineer","trust-sentinel","release-captain","community-signal"]);
assert.throws(()=>swarm.propose("x"),/objective/);
assert.throws(()=>swarm.propose("Build a project",{placeId:"not-a-place"}),/Unknown/);
const before={placeId:"plans",entityId:"example-entity",privateConversation:"must not cross"};
const original=JSON.stringify(before);
const plan=swarm.propose("Build a real community event",before);
assert.equal(JSON.stringify(before),original);
assert.deepEqual(plan.source,{placeId:"plans",entityId:"example-entity"});
assert.ok(!JSON.stringify(plan).includes("must not cross"));
assert.equal(plan.executionOwner,"Perception");
assert.equal(plan.version,"superstars-v1");
assert.equal(plan.jobs.length,5);
assert.ok(plan.jobs.every(job=>job.status==="proposed"&&job.allowedActions.every(action=>action.startsWith("draft_"))));
assert.ok(plan.jobs.every(job=>job.forbiddenActions.includes("publish")&&job.forbiddenActions.includes("read_private_messages")&&job.forbiddenActions.includes("execute_without_perception_grant")));
assert.deepEqual(swarm.acknowledgeRoute(plan,{ok:true,routeId:"route-1"}),{
  origin:"NETIZENS",executionOwner:"Perception",source:plan.source,status:"route_proposed",routeId:"route-1",jobCount:5,verifiedJobs:0,
  notice:"Perception proposed a route; worker execution and verification remain unconfirmed."
});
assert.equal(swarm.acknowledgeRoute(plan,{ok:true}).status,"failed");
assert.ok(swarm.propose("Community report",{placeId:"commons"}).jobs.some(job=>job.botId==="trust-sentinel"));
assert.ok(swarm.propose("Join a College Group",{placeId:"crews"}).jobs.some(job=>job.botId==="citizen-engineer"));
assert.ok(swarm.propose("Evaluate the World",{placeId:"commons"}).jobs.some(job=>job.botId==="world-architect"));
assert.ok(swarm.propose("A private conversation",{placeId:"circles"}).jobs.every(job=>!job.allowedActions.includes("read_private_messages")));
console.log("NETIZENS five-superstar proposal contract: PASS");
