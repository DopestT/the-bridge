import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const source=fs.readFileSync(new URL("./world-state.js",import.meta.url),"utf8");
const adapterSource=fs.readFileSync(new URL("./data-adapter.js",import.meta.url),"utf8");
const perceptionSource=fs.readFileSync(new URL("./perception-client.js",import.meta.url),"utf8");
const memory=new Map([["netizens_world_seed","qa-seed"]]);
const localStorage={
  getItem(key){ return memory.has(key)?memory.get(key):null; },
  setItem(key,value){ memory.set(key,String(value)); },
  removeItem(key){ memory.delete(key); }
};
class CustomEvent { constructor(type,init={}){ this.type=type; this.detail=init.detail; } }
const window={
  events:[],
  listeners:{},
  dispatchEvent(event){ this.events.push(event); const list=this.listeners[event.type]||[]; for(const fn of list) fn(event); },
  addEventListener(type,fn){ (this.listeners[type]||(this.listeners[type]=[])).push(fn); }
};
const context=vm.createContext({window,localStorage,CustomEvent,console,Math,Date,JSON,Array,String,Number,Object});
vm.runInContext(source,context,{filename:"world-state.js"});

const store=window.NetizensStore;
assert.ok(store,"NetizensStore should be exposed");
assert.equal(store.snapshot().version,3);

const initialXp=store.snapshot().citizen.xp;
store.visitPlace("commons");
assert.ok(store.snapshot().citizen.xp>initialXp,"first visit should award XP");
store.visitPlace("commons");
assert.equal(store.snapshot().world.visitedPlaces.commons.count,2);

store.createPlan("Museum Saturday",{source:"qa"});
assert.equal(store.snapshot().world.plans[0].title,"Museum Saturday");

const museumPlan=store.listEntities("plans",null).find(entity=>entity.title==="Museum Saturday");
assert.ok(museumPlan,"creating a Plan should also create an enterable World entity");
assert.equal(museumPlan.entityType,"plan");

const promotedEvent=store.promotePlanToEvent(museumPlan.id);
assert.ok(promotedEvent,"a Plan should promote into an Event");
assert.equal(promotedEvent.placeId,"events");
assert.equal(store.getEntity(museumPlan.id).status,"converted");
assert.ok(store.linksForEntity(museumPlan.id).some(link=>link.linkType==="became_event"),"Plan to Event relationship should be durable");
assert.ok(store.listEntities("circles",promotedEvent.id).some(entity=>entity.entityType==="circle"),"promoting a Plan should create a nested organizer Circle");

const askEntity=store.createEntity({
  placeId:"ask",
  entityType:"question",
  title:"How do we build a neighborhood media club?",
  summary:"Turn an open question into coordinated work."
});
const transformedProject=store.transformEntity(askEntity.id,"projects",{entityType:"project",linkType:"became_project"});
assert.ok(transformedProject,"Ask should be transformable into a Project");
assert.equal(transformedProject.placeId,"projects");
assert.ok(store.linksForEntity(askEntity.id).some(link=>link.toEntityId===transformedProject.id));

store.vote("qa-question","yes");
assert.equal(store.snapshot().world.yesNoVotes["qa-question"].choice,"yes");

store.setForm("privacy");
assert.equal(store.snapshot().citizen.form,"privacy");

store.saveRoute("Build a local film club",["local","crews","projects"]);
assert.deepEqual(Array.from(store.snapshot().world.savedRoutes[0].route),["local","crews","projects"]);

const futureA=store.futureScenario("1y");
const futureB=store.futureScenario("1y");
assert.equal(futureA.label,"+1 YEAR");
assert.deepEqual(futureA.metrics,futureB.metrics,"future scenario should be deterministic for the same state");
assert.equal(futureA.disclaimer,"Scenario, not prediction.");

vm.runInContext(adapterSource,context,{filename:"data-adapter.js"});
const data=window.NetizensData;
assert.ok(data,"NetizensData should be exposed");

const pendingBefore=data.getSyncStatus().pending;
data.createPlan("Adapter Plan",{source:"qa"});
assert.equal(data.getSyncStatus().pending,pendingBefore+1,"adapter should queue local-first mutations");

const delivered=[];
data.setTransport(async op=>{ delivered.push(op); return {ok:true}; });
const flushResult=await data.flush();
assert.ok(flushResult.flushed>=1,"adapter should flush queued operations");
assert.equal(data.getSyncStatus().pending,0,"queue should clear after successful transport");
assert.ok(delivered.some(op=>op.kind==="plan.create"),"transport should receive plan operation");

const queuedEntity=data.createEntity({placeId:"crews",entityType:"crew",title:"QA Crew"});
assert.equal(queuedEntity.placeId,"crews");
assert.equal(data.getSyncStatus().pending,1,"entity mutation should enter the local-first queue");
const entityFlush=await data.flush();
assert.equal(entityFlush.pending,0);
assert.ok(delivered.some(op=>op.kind==="entity.create"),"transport should receive entity operations");

vm.runInContext(perceptionSource,context,{filename:"perception-client.js"});
const perception=window.NetizensPerception;
assert.ok(perception,"NetizensPerception should be exposed");
assert.equal(perception.status().configured,false,"Perception should not pretend to be live without an authenticated host session");

const refs=perception.sourceRefs({placeId:"local",entityId:"crew-123",snapshotHash:"abc"});
assert.equal(refs[0].kind,"netizens_world");
assert.equal(refs[0].place_id,"local");
assert.equal(refs[0].entity_id,"crew-123");

perception.configure({endpoint:"https://example.test/perceive-objective",accessToken:"session-token"});
assert.equal(perception.status().configured,true);

context.fetch=async (_url,options)=>{
  const body=JSON.parse(options.body);
  assert.equal(body.statement,"Start a local film club");
  assert.equal(body.source_refs[0].place_id,"local");
  return {
    ok:true,
    status:200,
    async json(){
      return {
        ok:true,
        project_id:"project-1",
        objective_id:"objective-1",
        route_id:"route-1",
        source_context:{accepted:1},
        route_plan:{
          reason:"Connect the right places.",
          nodes:[
            {key:"discover",label:"Find local film people",outcome:"Build a candidate group",status:"ready",capability:"retrieve",permissionLevel:"P1",risk:"low"}
          ]
        }
      };
    }
  };
};

const live=await perception.submit("Start a local film club",{placeId:"local"});
assert.equal(live.ok,true);
assert.equal(live.routeId,"route-1");
assert.equal(live.sourceContextAccepted,1);
assert.equal(live.nodes[0].permissionLevel,"P1");

const legacyState={
  version:2,
  createdAt:"2026-01-01T00:00:00Z",
  updatedAt:"2026-01-01T00:00:00Z",
  citizen:{id:"citizen_legacy",name:"Legacy Citizen",initial:"L",xp:200,level:1,artifacts:["FOUNDER"],mode:"plans",form:"stylized",markSeed:"legacy-seed"},
  world:{
    visitedPlaces:{},
    joinedCrews:[],
    followedProjects:[],
    interestedEvents:[],
    plans:[{id:"plan_legacy",title:"Legacy Plan",status:"forming",createdAt:"2026-01-02T00:00:00Z",meta:{source:"migration-test"}}],
    yesNoVotes:{},
    savedRoutes:[],
    perceptionBindings:[],
    timeline:[]
  }
};
const legacyMemory=new Map([
  ["netizens_world_seed","legacy-seed"],
  ["netizens_world_state_v2",JSON.stringify(legacyState)]
]);
const legacyStorage={
  getItem(key){return legacyMemory.has(key)?legacyMemory.get(key):null;},
  setItem(key,value){legacyMemory.set(key,String(value));},
  removeItem(key){legacyMemory.delete(key);}
};
const legacyWindow={events:[],dispatchEvent(event){this.events.push(event);},addEventListener(){}};
const legacyContext=vm.createContext({window:legacyWindow,localStorage:legacyStorage,CustomEvent,console,Math,Date,JSON,Array,String,Number,Object});
vm.runInContext(source,legacyContext,{filename:"world-state-migration.js"});
const migrated=legacyWindow.NetizensStore.snapshot();
assert.equal(migrated.version,3,"V2 state should migrate to V3");
assert.equal(migrated.citizen.name,"Legacy Citizen");
assert.equal(legacyWindow.NetizensStore.getEntity("plan_legacy").placeId,"plans","legacy Plans should become World entities");
assert.ok(legacyMemory.has("netizens_world_state_v2"),"migration should not destroy the legacy state before the V3 state is saved");

console.log("NETIZENS World V3 state + entity graph + adapter + Perception client QA passed");