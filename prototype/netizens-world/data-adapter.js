(function(){
  "use strict";
  const local=window.NetizensStore;
  if(!local) throw new Error("NetizensStore must load before NetizensData");

  const QUEUE_KEY="netizens_sync_queue_v1";
  let transport=null;

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function fallbackUuid(){
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(char){
      const value=Math.floor(Math.random()*16);
      const nibble=char==="x" ? value : ((value&3)|8);
      return nibble.toString(16);
    });
  }
  function uid(){
    return globalThis.crypto && typeof globalThis.crypto.randomUUID==="function"
      ? globalThis.crypto.randomUUID()
      : fallbackUuid();
  }
  function readQueue(){
    try{
      const q=JSON.parse(localStorage.getItem(QUEUE_KEY)||"[]");
      return Array.isArray(q)?q:[];
    }catch(_){ return []; }
  }
  function writeQueue(queue){
    localStorage.setItem(QUEUE_KEY,JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent("netizens:sync-state",{detail:getSyncStatus()}));
  }
  function enqueue(kind,payload){
    const queue=readQueue();
    queue.push({
      id:uid(),
      kind:kind,
      payload:clone(payload||{}),
      createdAt:new Date().toISOString(),
      attempts:0
    });
    writeQueue(queue.slice(-250));
  }
  function mutate(kind,payload,fn){
    const result=fn();
    enqueue(kind,payload);
    return result;
  }
  function setTransport(handler){
    if(handler!==null && typeof handler!=="function") throw new TypeError("transport must be a function or null");
    transport=handler;
  }
  function getSyncStatus(){
    const queue=readQueue();
    return {
      mode:transport?"transport-ready":"local-first",
      pending:queue.length,
      oldest:queue.length?queue[0].createdAt:null
    };
  }
  async function flush(){
    if(!transport) return {flushed:0,pending:readQueue().length,status:"no-transport"};
    const queue=readQueue();
    const remaining=[];
    let flushed=0;
    for(const op of queue){
      try{
        op.attempts=(op.attempts||0)+1;
        const outbound=Object.assign({},clone(op),{mutationId:op.id});
        const result=await transport(outbound);
        if(result && result.ok===false) remaining.push(op);
        else flushed+=1;
      }catch(_){
        remaining.push(op);
      }
    }
    writeQueue(remaining);
    return {flushed:flushed,pending:remaining.length,status:remaining.length?"partial":"complete"};
  }

  const data={
    snapshot:()=>local.snapshot(),
    save:()=>local.save(),
    reset:()=>{localStorage.removeItem(QUEUE_KEY);return local.reset();},
    seed:()=>local.seed(),
    hash:(v)=>local.hash(v),
    futureScenario:(h)=>local.futureScenario(h),
    getSyncStatus,
    setTransport,
    flush,
    visitPlace:(id)=>mutate("place.visit",{placeId:id},()=>local.visitPlace(id)),
    setMode:(id)=>mutate("citizen.mode",{placeId:id},()=>local.setMode(id)),
    setForm:(form)=>mutate("citizen.avatar_form",{form:form},()=>local.setForm(form)),
    setCitizen:(input)=>mutate("citizen.update",{input:input},()=>local.setCitizen(input)),
    awardXP:(amount,reason)=>mutate("citizen.xp",{amount:amount,reason:reason},()=>local.awardXP(amount,reason)),
    addArtifact:(name)=>mutate("citizen.artifact",{artifact:name},()=>local.addArtifact(name)),
    toggleList:(listName,value)=>mutate("world.toggle",{list:listName,value:value},()=>local.toggleList(listName,value)),
    createPlan:(title,meta)=>mutate("plan.create",{title:title,meta:meta||{}},()=>local.createPlan(title,meta)),
    vote:(questionId,choice)=>mutate("yesno.vote",{questionId:questionId,choice:choice},()=>local.vote(questionId,choice)),
    saveRoute:(objective,route)=>mutate("perception.route.save",{objective:objective,route:Array.from(route||[])},()=>local.saveRoute(objective,route)),
    savePerceptionBinding:(binding)=>mutate("perception.binding.save",{binding:binding},()=>local.savePerceptionBinding(binding)),
    createEntity:(input)=>mutate("entity.create",{input:input},()=>local.createEntity(input)),
    getEntity:(id)=>local.getEntity(id),
    listEntities:(placeId,parentEntityId)=>local.listEntities(placeId,parentEntityId),
    updateEntity:(id,patch)=>mutate("entity.update",{id:id,patch:patch},()=>local.updateEntity(id,patch)),
    setEntityMembership:(entityId,status,role,provenance="genuine")=>mutate(
      "entity.membership",
      {entityId:entityId,status:status,role:role,provenance:provenance},
      ()=>local.setEntityMembership(entityId,status,role,provenance)
    ),
    getEntityMembership:(entityId)=>local.getEntityMembership(entityId),
    createDiscussionItem:(input)=>mutate("discussion.create",{input:input||{}},()=>local.createDiscussionItem(input||{})),
    listDiscussion:(entityId)=>local.listDiscussion(entityId),
    markDiscussionItemModerated:(id,state)=>mutate("discussion.moderate",{id:id,state:state},()=>local.markDiscussionItemModerated(id,state)),
    listNotifications:()=>local.listNotifications(),
    markNotificationRead:(id)=>mutate("notification.read",{id:id},()=>local.markNotificationRead(id)),
    linkEntities:(fromEntityId,toEntityId,linkType)=>mutate("entity.link",{fromEntityId:fromEntityId,toEntityId:toEntityId,linkType:linkType},()=>local.linkEntities(fromEntityId,toEntityId,linkType)),
    linksForEntity:(entityId)=>local.linksForEntity(entityId),
    promotePlanToEvent:(entityId)=>mutate("plan.promote",{entityId:entityId},()=>local.promotePlanToEvent(entityId)),
    transformEntity:(entityId,targetPlace,options)=>mutate("entity.transform",{entityId:entityId,targetPlace:targetPlace,options:options||{}},()=>local.transformEntity(entityId,targetPlace,options))
  };

  window.NetizensData=data;
  window.addEventListener("online",function(){ void flush(); });
})();