(function(){
  "use strict";

  let config={ endpoint:"", accessToken:"" };

  function clean(value,limit){
    return typeof value==="string" ? value.trim().slice(0,limit||500) : "";
  }

  function configure(next){
    next=next||{};
    config={
      endpoint:clean(next.endpoint,1000),
      accessToken:clean(next.accessToken,8000)
    };
    window.dispatchEvent(new CustomEvent("netizens:perception-config",{detail:status()}));
    return status();
  }

  function status(){
    return {
      configured:Boolean(config.endpoint && config.accessToken),
      endpointConfigured:Boolean(config.endpoint),
      sessionConfigured:Boolean(config.accessToken)
    };
  }

  function sourceRefs(context){
    context=context||{};
    const placeId=clean(context.placeId,120);
    const entityId=clean(context.entityId,160);
    const snapshotHash=clean(context.snapshotHash,160);
    let ref="netizens://world";
    if(placeId) ref+="/place/"+encodeURIComponent(placeId);
    if(entityId) ref+="/entity/"+encodeURIComponent(entityId);

    const item={
      kind:"netizens_world",
      ref:ref,
      source:"netizens",
      ...(placeId?{place_id:placeId}:{}),
      ...(entityId?{entity_id:entityId}:{}),
      ...(snapshotHash?{snapshot_hash:snapshotHash}:{})
    };
    return [item];
  }

  function normalizeRoute(payload){
    payload=payload && typeof payload==="object" ? payload : {};
    const routePlan=payload.route_plan && typeof payload.route_plan==="object" ? payload.route_plan : {};
    const nodes=Array.isArray(routePlan.nodes) ? routePlan.nodes : [];
    return {
      ok:payload.ok!==false,
      projectId:clean(payload.project_id,160)||null,
      objectiveId:clean(payload.objective_id,160)||null,
      routeId:clean(payload.route_id,160)||null,
      reason:clean(routePlan.reason,2000),
      sourceContextAccepted:Number(payload?.source_context?.accepted||0),
      nodes:nodes.slice(0,20).map(function(node){
        node=node && typeof node==="object" ? node : {};
        return {
          key:clean(node.key,160),
          label:clean(node.label,300),
          outcome:clean(node.outcome,1200),
          status:clean(node.status,80),
          capability:clean(node.capability,80),
          permissionLevel:clean(node.permissionLevel||node.permission_level,20),
          risk:clean(node.risk,40)
        };
      })
    };
  }

  async function submit(statement,context){
    const current=status();
    if(!current.configured){
      return {ok:false,configured:false,error:"Perception is not connected in this client session."};
    }

    const objective=clean(statement,10000);
    if(objective.length<3) return {ok:false,configured:true,error:"Objective is too short."};

    const response=await fetch(config.endpoint,{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+config.accessToken,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        statement:objective,
        source_refs:sourceRefs(context)
      })
    });

    let payload={};
    try{ payload=await response.json(); }catch(_){ payload={}; }

    if(!response.ok){
      return {
        ok:false,
        configured:true,
        status:response.status,
        error:clean(payload.error,1000)||"Perception request failed."
      };
    }

    const normalized=normalizeRoute(payload);
    window.dispatchEvent(new CustomEvent("netizens:perception-result",{detail:normalized}));
    return normalized;
  }

  window.NetizensPerception={configure,status,sourceRefs,normalizeRoute,submit};
})();