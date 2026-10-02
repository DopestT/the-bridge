(function(){
  "use strict";
  const local=window.NetizensStore;
  if(!local) throw new Error("NetizensStore must load before NetizensData");

  const QUEUE_KEY="netizens_sync_queue_v1";
  let transport=null;

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function uid(){
    return (globalThis.crypto && crypto.randomUUID)?crypto.randomUUID():"op_"+Math.random().toString(36).slice(2)+Date.now().toString(36);
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
        const result=await transport(clone(op));
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
    savePerceptionBinding:(binding)=>mutate("perception.binding.save",{binding:binding},()=>local.savePerceptionBinding(binding))
  };

  window.NetizensData=data;
  window.addEventListener("online",function(){ void flush(); });
})();