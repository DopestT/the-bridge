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
assert.equal(store.snapshot().version,2);

const initialXp=store.snapshot().citizen.xp;
store.visitPlace("commons");
assert.ok(store.snapshot().citizen.xp>initialXp,"first visit should award XP");
store.visitPlace("commons");
assert.equal(store.snapshot().world.visitedPlaces.commons.count,2);

store.createPlan("Museum Saturday",{source:"qa"});
assert.equal(store.snapshot().world.plans[0].title,"Museum Saturday");

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

console.log("NETIZENS World state + adapter + Perception client QA passed");