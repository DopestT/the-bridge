import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const storeSource=fs.readFileSync(new URL("./world-state.js",import.meta.url),"utf8");
const adapterSource=fs.readFileSync(new URL("./data-adapter.js",import.meta.url),"utf8");
const memory=new Map([["netizens_world_seed","adapter-qa-seed"]]);
const localStorage={
  getItem(key){return memory.has(key)?memory.get(key):null;},
  setItem(key,value){memory.set(key,String(value));},
  removeItem(key){memory.delete(key);}
};
class CustomEvent { constructor(type,init={}){this.type=type;this.detail=init.detail;} }
const window={
  listeners:{},
  dispatchEvent(event){for(const fn of this.listeners[event.type]||[]) fn(event);},
  addEventListener(type,fn){(this.listeners[type]||(this.listeners[type]=[])).push(fn);}
};
const context=vm.createContext({window,localStorage,CustomEvent,console,Math,Date,JSON,Array,String,Number,Object});
vm.runInContext(storeSource,context,{filename:"world-state.js"});
const store=window.NetizensStore;
const entity=store.createEntity({placeId:"crews",entityType:"crew",title:"Adapter QA Crew"});
vm.runInContext(adapterSource,context,{filename:"data-adapter.js"});
const data=window.NetizensData;

for(const method of ["createDiscussionItem","listDiscussion","markDiscussionItemModerated","listNotifications","markNotificationRead"]){
  assert.equal(typeof data[method],"function",`${method} should be exposed by the local-first adapter`);
}

let failDiscussionOnce=true;
const attempts=[];
data.setTransport(async op=>{
  attempts.push(JSON.parse(JSON.stringify(op)));
  if(op.kind==="discussion.create" && failDiscussionOnce){
    failDiscussionOnce=false;
    return {ok:false};
  }
  return {ok:true};
});

const before=data.getSyncStatus().pending;
const post=data.createDiscussionItem({entityId:entity.id,body:"Retry this exactly once."});
assert.ok(post,"discussion create should apply optimistically before network confirmation");
assert.equal(data.listDiscussion(entity.id).length,1,"optimistic discussion should be immediately visible");
assert.equal(data.getSyncStatus().pending,before+1,"discussion creation should queue exactly one mutation");

const firstFlush=await data.flush();
assert.equal(firstFlush.pending,1,"failed transport should leave the same logical mutation pending");
const firstAttempt=attempts.find(op=>op.kind==="discussion.create");
assert.ok(firstAttempt,"transport should receive discussion.create");
assert.equal(firstAttempt.mutationId,firstAttempt.id,"transport mutationId should equal the durable queue operation id");
assert.match(
  firstAttempt.mutationId,
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  "queue mutation IDs must remain valid UUIDs even when crypto.randomUUID is unavailable"
);

const queueAfterFailure=JSON.parse(memory.get("netizens_sync_queue_v1")||"[]");
assert.equal(queueAfterFailure.length,1,"retry should not enqueue a replacement operation");
assert.equal(queueAfterFailure[0].id,firstAttempt.id,"pending retry should preserve the original operation id");

const secondFlush=await data.flush();
assert.equal(secondFlush.pending,0,"successful retry should clear the mutation");
const discussionAttempts=attempts.filter(op=>op.kind==="discussion.create");
assert.equal(discussionAttempts.length,2,"discussion mutation should be attempted once and retried once");
assert.ok(discussionAttempts.every(op=>op.id===firstAttempt.id),"every retry should keep one operation id");
assert.ok(discussionAttempts.every(op=>op.mutationId===firstAttempt.id),"every retry should keep one idempotency key");
assert.equal(data.listDiscussion(entity.id).length,1,"transport retry must not duplicate optimistic local state");

const membershipBefore=data.getSyncStatus().pending;
data.setEntityMembership(entity.id,"active","member","demo");
assert.equal(data.getSyncStatus().pending,membershipBefore+1,"membership change should queue through the same adapter");
const membership=store.getEntityMembership(entity.id);
assert.equal(membership.provenance,"demo","adapter should preserve membership provenance");
await data.flush();
const membershipOp=attempts.find(op=>op.kind==="entity.membership" && op.payload&&op.payload.entityId===entity.id);
assert.equal(membershipOp.payload.provenance,"demo","membership transport payload should preserve provenance");
assert.equal(membershipOp.mutationId,membershipOp.id,"membership transport should also carry a stable idempotency key");

const moderated=data.markDiscussionItemModerated(post.id,"hidden");
assert.equal(moderated.moderationState,"hidden");
assert.ok(data.getSyncStatus().pending>=1,"moderation should queue as a bounded mutation");

console.log("NETIZENS participation adapter idempotency QA passed");