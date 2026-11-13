import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const swarm=require("./swarm.js");
assert.equal(swarm.bots.length,14);
assert.equal(new Set(swarm.bots.map(bot=>bot.id)).size,14);
assert.throws(()=>swarm.propose("x"),/objective/);
assert.throws(()=>swarm.propose("Build a project",{placeId:"not-a-place"}),/Unknown/);
const before={placeId:"plans",entityId:"example-entity",privateConversation:"must not cross"};
const original=JSON.stringify(before);
const plan=swarm.propose("Build a film club event",before);
assert.equal(JSON.stringify(before),original);
assert.deepEqual(plan.source,{placeId:"plans",entityId:"example-entity"});
assert.ok(!JSON.stringify(plan).includes("must not cross"));
assert.equal(plan.executionOwner,"Perception");
assert.ok(plan.jobs.some(job=>job.botId==="event-planner"));
assert.ok(plan.jobs.some(job=>job.botId==="project-builder"));
assert.ok(plan.jobs.every(job=>job.status==="proposed"&&job.allowedActions.every(action=>action.startsWith("draft_")||action==="suggest_places"||action==="suggest_public_sources")));
assert.ok(plan.jobs.every(job=>job.forbiddenActions.includes("publish")&&job.forbiddenActions.includes("read_private_messages")));
assert.deepEqual(swarm.acknowledgeRoute(plan,{ok:true,routeId:"route-1"}),{
  origin:"NETIZENS",executionOwner:"Perception",source:plan.source,status:"route_proposed",routeId:"route-1",jobCount:plan.jobs.length,verifiedJobs:0,
  notice:"Perception proposed a route; worker execution and verification remain unconfirmed."
});
assert.equal(swarm.acknowledgeRoute(plan,{ok:true}).status,"failed");
assert.ok(swarm.propose("Ask a question",{placeId:"ask"}).jobs.some(job=>job.botId==="source-scout"));
assert.ok(swarm.propose("How should we vote?",{placeId:"yesno"}).jobs.some(job=>job.botId==="vote-integrity"));
assert.ok(swarm.propose("Community report",{placeId:"commons"}).jobs.some(job=>job.botId==="moderation-triage"));
assert.ok(swarm.propose("A private conversation",{placeId:"circles"}).jobs.every(job=>!job.allowedActions.includes("read_private_messages")));
assert.equal(swarm.propose("General objective").jobs.filter(job=>job.botId==="scope-guardian").length,1);
console.log("NETIZENS bounded swarm contract: PASS");
