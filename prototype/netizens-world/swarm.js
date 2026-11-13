/* NETIZENS bounded swarm planner. Perception remains the only execution authority. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  if(root) root.NetizensSwarm=api;
})(typeof window!=="undefined"?window:null,function(){
  "use strict";
  const PLACES=["commons","crews","local","projects","ask","exchange","circles","events","plans","yesno"];
  const ALWAYS_FORBIDDEN=["publish","invite_or_message_someone","spend_money","change_permissions","moderate_account","read_private_messages","execute_without_perception_grant","mark_verified_without_evidence"];
  const BOTS=Object.freeze([
    {id:"scope-guardian",name:"Scope Guardian",places:["*"],job:"Check Citizen/Place/Entity access boundaries and classify risky operations.",allowed:["draft_scope_review"],deliverable:"permission questions and blocked actions",acceptance:"No social/private access is inferred from a visible public entity."},
    {id:"world-router",name:"World Router",places:["*"],job:"Identify relevant World Places without changing World state.",allowed:["suggest_places"],deliverable:"proposed Place route",acceptance:"Only known NETIZENS Places are proposed."},
    {id:"source-scout",name:"Source Scout",places:["ask","local","commons"],job:"Locate candidate public information and flag missing primary evidence.",allowed:["suggest_public_sources"],deliverable:"source shortlist with freshness and provenance",acceptance:"Unverified sources are labeled; no invented citation."},
    {id:"civic-resource-watch",name:"Civic Resource Watch",places:["local","ask","commons"],job:"Check official-resource links and expiry before civic guidance.",allowed:["draft_resource_check"],deliverable:"dated official-link review",acceptance:"Expired/uncertain guidance is withheld pending review."},
    {id:"crew-steward",name:"Crew Steward",places:["crews","circles"],job:"Plan optional community participation with membership and privacy gates.",allowed:["draft_crew_plan"],deliverable:"private-safe group participation draft",acceptance:"No automatic enrollment or private Circle access."},
    {id:"moderation-triage",name:"Moderation Triage",places:["commons","crews","circles"],job:"Classify reports and surface human review/appeal needs.",allowed:["draft_report_triage"],deliverable:"restricted review recommendation",acceptance:"No automated sanction, allegation, or publication."},
    {id:"project-builder",name:"Project Builder",places:["projects","plans","ask"],job:"Draft milestones, responsible people and next dependency for a project.",allowed:["draft_project_plan"],deliverable:"project draft and dependencies",acceptance:"No project or event is created without an approved operation."},
    {id:"event-planner",name:"Event Planner",places:["events","plans"],job:"Draft event logistics and consent-aware invitations.",allowed:["draft_event_plan"],deliverable:"event draft and approval checklist",acceptance:"No calendar change or invitation is sent."},
    {id:"exchange-matcher",name:"Exchange Matcher",places:["exchange"],job:"Outline voluntary skill and resource matches.",allowed:["draft_match_candidates"],deliverable:"match criteria and consent questions",acceptance:"No contact data exposure or unsolicited message."},
    {id:"vote-integrity",name:"Yes/No Integrity",places:["yesno"],job:"Review vote provenance and advisory-question clarity.",allowed:["draft_vote_integrity_review"],deliverable:"vote-integrity review",acceptance:"Seeded/demo votes are not counted as genuine; not official elections."},
    {id:"evidence-challenger",name:"Evidence Challenger",places:["*"],job:"Flag contradictions, unsupported conclusions and counterevidence.",allowed:["draft_contradiction_review"],deliverable:"evidence and contradiction log",acceptance:"Claims remain unverified without independently checkable sources."},
    {id:"accessibility-reviewer",name:"Accessibility Reviewer",places:["*"],job:"Review draft text, captions and accessible interaction requirements.",allowed:["draft_accessibility_review"],deliverable:"accessibility checklist",acceptance:"Check does not imply a tested accessible production experience."},
    {id:"outcome-verifier",name:"Outcome Verifier",places:["*"],job:"Specify real-world evidence required to claim completion.",allowed:["draft_verification_checklist"],deliverable:"acceptance tests and independent proof requirements",acceptance:"Only Perception's verified execution record can close a job."},
    {id:"measurement-auditor",name:"Measurement Auditor",places:["*"],job:"Specify denominators and genuine-vs-seeded usage definitions.",allowed:["draft_metric_definitions"],deliverable:"measurement checklist",acceptance:"No test/demo traffic presented as real adoption."}
  ].map(function(bot){return Object.freeze(bot);}));
  const byId=Object.freeze(Object.fromEntries(BOTS.map(function(bot){return [bot.id,bot];})));
  function clean(value,max){return typeof value==="string"?value.trim().slice(0,max):"";}
  function propose(objective,context){
    const input=clean(objective,10000);
    if(input.length<3) throw new Error("An objective of at least three characters is required.");
    context=context&&typeof context==="object"?context:{};
    const place=clean(context.placeId,40);
    if(place && !PLACES.includes(place)) throw new Error("Unknown source Place.");
    const source={placeId:place||null,entityId:clean(context.entityId,160)||null};
    const primary=["scope-guardian","world-router"];
    const specialty=BOTS.filter(function(bot){return !primary.includes(bot.id) && !["evidence-challenger","accessibility-reviewer","outcome-verifier","measurement-auditor"].includes(bot.id) && place && bot.places.includes(place);}).map(function(bot){return bot.id;});
    const matched=new Set(primary.concat(specialty,["evidence-challenger","accessibility-reviewer","outcome-verifier","measurement-auditor"]));
    const jobs=Array.from(matched).map(function(id,index){
      const bot=byId[id];
      return {taskKey:"NET-SWARM-"+String(index+1).padStart(2,"0"),botId:bot.id,worker:bot.name,job:bot.job,allowedActions:bot.allowed.slice(),forbiddenActions:ALWAYS_FORBIDDEN.slice(),deliverable:bot.deliverable,acceptance:bot.acceptance,reviewOwner:"Perception + authorized human",status:"proposed"};
    });
    return {origin:"NETIZENS",executionOwner:"Perception",objective:input,source:source,status:"proposed",jobs:jobs,notice:"Job assignments are drafts. No bots have executed, no permissions are granted, and no outcome is verified."};
  }
  function acknowledgeRoute(plan,reply){
    if(!plan||plan.origin!=="NETIZENS"||!Array.isArray(plan.jobs)) throw new Error("Invalid NETIZENS proposal.");
    const ok=Boolean(reply&&reply.ok===true&&clean(reply.routeId,160));
    return {origin:"NETIZENS",executionOwner:"Perception",source:plan.source,status:ok?"route_proposed":"failed",routeId:ok?reply.routeId:null,jobCount:plan.jobs.length,verifiedJobs:0,notice:ok?"Perception proposed a route; worker execution and verification remain unconfirmed.":"Perception route was not confirmed; no job executed."};
  }
  return Object.freeze({places:PLACES.slice(),bots:BOTS,propose:propose,acknowledgeRoute:acknowledgeRoute});
});
