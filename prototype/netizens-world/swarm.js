/* NETIZENS five-superstar proposal roster, replacing the historical 14-role preview.
 * Perception owns execution; nothing in this module starts an agent or grants permission. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  if(root) root.NetizensSwarm=api;
})(typeof window!=="undefined"?window:null,function(){
  "use strict";
  const PLACES=["commons","crews","local","projects","ask","exchange","circles","events","plans","yesno"];
  const ALWAYS_FORBIDDEN=["publish","invite_or_message_someone","spend_money","change_permissions","moderate_account","read_private_messages","execute_without_perception_grant","mark_verified_without_evidence"];
  const BOTS=Object.freeze([
    {id:"world-architect",name:"World Architect",places:["*"],job:"Inspect World-to-Place-to-Entity visual navigation against the approved cinematic design; propose one source-faithful, accessible fix.",allowed:["draft_world_review"],deliverable:"visual/navigation discrepancy and reviewable fix plan",acceptance:"Approved reference comparison and runnable navigation tests; no fake citizens or invented World art."},
    {id:"citizen-engineer",name:"Citizen Engineer",places:["*"],job:"Trace permanent-Citizen login, join, post, reply, private consent and offline reconciliation into a real usable social loop.",allowed:["draft_citizen_flow_review"],deliverable:"one repro-based social-flow improvement and test plan",acceptance:"Two-account RLS, offline retry and device checks; social features remain usable without Perception."},
    {id:"trust-sentinel",name:"Trust Sentinel",places:["*"],job:"Independently challenge authorization, privacy, moderation, misinformation, consent and genuine-versus-demo claims.",allowed:["draft_security_review"],deliverable:"evidence-based adversarial test matrix",acceptance:"No private DM or Circle access, no automated sanctions and no unreviewed public accusations."},
    {id:"release-captain",name:"Release Captain",places:["*"],job:"Map and verify native build, signing, crash, speed, push and two-device private beta acceptance.",allowed:["draft_release_review"],deliverable:"exact build/CI/device acceptance checklist",acceptance:"An APK or passing CI is not real-device or production acceptance."},
    {id:"community-signal",name:"Community Signal",places:["*"],job:"Define measurable first-session participation, real community value and return visits without fake activity.",allowed:["draft_measurement_review"],deliverable:"first-visit/return metrics and source-labeled acquisition drafts",acceptance:"No demo counts as real adoption; no unauthorized publishing, outreach or spending."}
  ].map(bot=>Object.freeze(bot)));
  function clean(value,max){return typeof value==="string"?value.trim().slice(0,max):"";}
  function propose(objective,context){
    const input=clean(objective,10000);
    if(input.length<3) throw new Error("An objective of at least three characters is required.");
    context=context&&typeof context==="object"?context:{};
    const place=clean(context.placeId,40);
    if(place&&!PLACES.includes(place)) throw new Error("Unknown source Place.");
    const source={placeId:place||null,entityId:clean(context.entityId,160)||null};
    const jobs=BOTS.map((bot,index)=>({
      taskKey:"NET-STAR-"+String(index+1).padStart(2,"0"),botId:bot.id,worker:bot.name,
      job:bot.job,allowedActions:bot.allowed.slice(),forbiddenActions:ALWAYS_FORBIDDEN.slice(),
      deliverable:bot.deliverable,acceptance:bot.acceptance,
      reviewOwner:"Perception + authorized human",status:"proposed"
    }));
    return {origin:"NETIZENS",version:"superstars-v1",executionOwner:"Perception",objective:input,source,
      status:"proposed",jobs,notice:"Five specialist job proposals only. No bots have executed, no permissions are granted, and no outcomes are verified."};
  }
  function acknowledgeRoute(plan,reply){
    if(!plan||plan.origin!=="NETIZENS"||!Array.isArray(plan.jobs)) throw new Error("Invalid NETIZENS proposal.");
    const ok=Boolean(reply&&reply.ok===true&&clean(reply.routeId,160));
    return {origin:"NETIZENS",executionOwner:"Perception",source:plan.source,status:ok?"route_proposed":"failed",
      routeId:ok?reply.routeId:null,jobCount:plan.jobs.length,verifiedJobs:0,
      notice:ok?"Perception proposed a route; worker execution and verification remain unconfirmed.":"Perception route was not confirmed; no job executed."};
  }
  return Object.freeze({places:PLACES.slice(),bots:BOTS,propose,acknowledgeRoute});
});
