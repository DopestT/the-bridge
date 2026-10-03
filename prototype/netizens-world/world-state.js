(function(){
  "use strict";

  const KEY="netizens_world_state_v3";
  const LEGACY_KEY="netizens_world_state_v2";
  const SCHEMA_VERSION=3;
  const PLACE_IDS=["commons","crews","local","projects","ask","exchange","circles","events","plans","yesno"];

  function now(){ return new Date().toISOString(); }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function uid(prefix){
    const token=(globalThis.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)+Date.now().toString(36);
    return (prefix||"id")+"_"+token;
  }
  function clean(value,limit){
    return typeof value==="string" ? value.trim().slice(0,limit||500) : "";
  }
  function seed(){
    let value=localStorage.getItem("netizens_world_seed");
    if(!value){
      value=(globalThis.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
      localStorage.setItem("netizens_world_seed",value);
    }
    return value;
  }
  function hash(str){
    let h=2166136261;
    for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
    return h>>>0;
  }
  function validPlace(id){ return PLACE_IDS.includes(id); }
  function calcLevel(xp){ return Math.max(1,Math.floor(Number(xp||0)/500)+1); }

  function defaultWorld(){
    return {
      visitedPlaces:{},
      joinedCrews:[],
      followedProjects:[],
      interestedEvents:[],
      plans:[],
      yesNoVotes:{},
      savedRoutes:[],
      perceptionBindings:[],
      entities:{},
      entityOrder:[],
      entityMemberships:{},
      entityLinks:[],
      timeline:[]
    };
  }

  function defaultState(){
    return {
      version:SCHEMA_VERSION,
      createdAt:now(),
      updatedAt:now(),
      citizen:{
        id:uid("citizen"),
        name:"Citizen 001",
        initial:"K",
        xp:120,
        level:1,
        artifacts:["FOUNDER"],
        mode:"commons",
        form:"stylized",
        markSeed:seed()
      },
      world:defaultWorld()
    };
  }

  function entityRecord(input,citizenId){
    const value=input && typeof input==="object" ? input : {};
    const placeId=validPlace(value.placeId) ? value.placeId : "commons";
    const title=clean(value.title,120)||"Untitled";
    const createdAt=clean(value.createdAt,80)||now();
    return {
      id:clean(value.id,180)||uid(value.entityType||"entity"),
      placeId,
      entityType:clean(value.entityType,80)||placeId.slice(0,-1)||"entity",
      parentEntityId:clean(value.parentEntityId,180)||null,
      creatorId:clean(value.creatorId,180)||citizenId||null,
      title,
      summary:clean(value.summary,1000),
      visibility:["public","members","invite","private"].includes(value.visibility) ? value.visibility : "public",
      status:clean(value.status,80)||"active",
      metadata:value.metadata && typeof value.metadata==="object" && !Array.isArray(value.metadata) ? clone(value.metadata) : {},
      createdAt,
      updatedAt:clean(value.updatedAt,80)||createdAt
    };
  }

  function seedEntities(state){
    const samples=[
      {id:"seed_crew_film",placeId:"crews",entityType:"crew",title:"Film & Creators",summary:"A place for people making films, video, and visual stories together.",metadata:{members:2400,seeded:true}},
      {id:"seed_college_umd",placeId:"crews",entityType:"crew",title:"University of Maryland",summary:"A NETIZENS campus group for students to connect around campus life, issues, projects, events, and civic participation.",metadata:{kind:"college_group",campus:"University of Maryland, College Park",region:"DMV",pilot:true,seeded:true}},
      {id:"seed_college_howard",placeId:"crews",entityType:"crew",title:"Howard University",summary:"A NETIZENS campus group for students to connect around campus life, issues, projects, events, and civic participation.",metadata:{kind:"college_group",campus:"Howard University",region:"DMV",pilot:true,seeded:true}},
      {id:"seed_college_georgetown",placeId:"crews",entityType:"crew",title:"Georgetown University",summary:"A NETIZENS campus group for students to connect around campus life, issues, projects, events, and civic participation.",metadata:{kind:"college_group",campus:"Georgetown University",region:"DMV",pilot:true,seeded:true}},
      {id:"seed_college_gwu",placeId:"crews",entityType:"crew",title:"George Washington University",summary:"A NETIZENS campus group for students to connect around campus life, issues, projects, events, and civic participation.",metadata:{kind:"college_group",campus:"George Washington University",region:"DMV",pilot:true,seeded:true}},
      {id:"seed_college_american",placeId:"crews",entityType:"crew",title:"American University",summary:"A NETIZENS campus group for students to connect around campus life, issues, projects, events, and civic participation.",metadata:{kind:"college_group",campus:"American University",region:"DMV",pilot:true,seeded:true}},
      {id:"seed_project_indie",placeId:"projects",entityType:"project",title:"Indie Film Series",summary:"A collaborative independent film series moving from idea to finished screenings.",metadata:{progress:40,members:32,seeded:true}},
      {id:"seed_event_rooftop",placeId:"events",entityType:"event",title:"Rooftop Concert",summary:"A Saturday rooftop set built around discovering local music.",metadata:{when:"Saturday",seeded:true}},
      {id:"seed_plan_ramen",placeId:"plans",entityType:"plan",title:"Ramen Friday",summary:"Anybody want to try the new ramen place Friday?",status:"forming",metadata:{interested:4,seeded:true}},
      {id:"seed_ask_filmclub",placeId:"ask",entityType:"question",title:"How do we start a local film club?",summary:"Looking for people, a first venue, and a simple recurring format.",metadata:{seeded:true}}
    ];

    for(const item of samples){
      if(state.world.entities[item.id]) continue;
      const entity=entityRecord(item,state.citizen.id);
      state.world.entities[entity.id]=entity;
      state.world.entityOrder.push(entity.id);
    }
  }

  function migrateLegacyPlans(state){
    for(const plan of state.world.plans||[]){
      if(!plan || !plan.id || state.world.entities[plan.id]) continue;
      const entity=entityRecord({
        id:plan.id,
        placeId:"plans",
        entityType:"plan",
        title:plan.title,
        summary:plan.meta && plan.meta.summary,
        status:plan.status||"forming",
        metadata:Object.assign({},plan.meta||{},{legacyPlan:true}),
        createdAt:plan.createdAt
      },state.citizen.id);
      state.world.entities[entity.id]=entity;
      state.world.entityOrder.unshift(entity.id);
    }
  }

  function normalize(raw){
    const base=defaultState();
    if(!raw || typeof raw!=="object"){
      seedEntities(base);
      return base;
    }

    const state=Object.assign(base,raw);
    state.citizen=Object.assign(base.citizen,raw.citizen||{});
    state.world=Object.assign(defaultWorld(),raw.world||{});

    if(!state.world.entities || typeof state.world.entities!=="object" || Array.isArray(state.world.entities)) state.world.entities={};
    if(!Array.isArray(state.world.entityOrder)) state.world.entityOrder=[];
    if(!state.world.entityMemberships || typeof state.world.entityMemberships!=="object" || Array.isArray(state.world.entityMemberships)) state.world.entityMemberships={};
    if(!Array.isArray(state.world.entityLinks)) state.world.entityLinks=[];

    const normalizedEntities={};
    for(const [id,value] of Object.entries(state.world.entities)){
      const entity=entityRecord(Object.assign({},value,{id}),state.citizen.id);
      normalizedEntities[entity.id]=entity;
    }
    state.world.entities=normalizedEntities;
    state.world.entityOrder=state.world.entityOrder.filter((id,index,list)=>Boolean(state.world.entities[id])&&list.indexOf(id)===index);

    migrateLegacyPlans(state);
    seedEntities(state);
    state.version=SCHEMA_VERSION;
    state.citizen.level=calcLevel(state.citizen.xp);
    return state;
  }

  function load(){
    try{
      const current=localStorage.getItem(KEY);
      if(current) return normalize(JSON.parse(current));
      const legacy=localStorage.getItem(LEGACY_KEY);
      if(legacy) return normalize(JSON.parse(legacy));
    }catch(_){}
    return normalize(null);
  }

  let state=load();

  function save(){
    state.updatedAt=now();
    localStorage.setItem(KEY,JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("netizens:state",{detail:snapshot()}));
    return snapshot();
  }
  function snapshot(){ return clone(state); }

  function timeline(type,data){
    state.world.timeline.unshift({id:uid("moment"),type,at:now(),data:data||{}});
    state.world.timeline=state.world.timeline.slice(0,150);
  }

  function awardXP(amount,reason){
    const points=Math.max(0,Number(amount)||0);
    state.citizen.xp+=points;
    state.citizen.level=calcLevel(state.citizen.xp);
    if(reason) timeline("xp",{amount:points,reason});
    return save();
  }

  function addArtifact(name){
    const cleanName=clean(name,80);
    if(cleanName && !state.citizen.artifacts.includes(cleanName)) state.citizen.artifacts.push(cleanName);
    return save();
  }

  function visitPlace(id){
    if(!validPlace(id)) return snapshot();
    const visits=state.world.visitedPlaces;
    const first=!visits[id];
    visits[id]=Object.assign({count:0,firstVisitedAt:now()},visits[id]||{});
    visits[id].count+=1;
    visits[id].lastVisitedAt=now();
    timeline("place_visit",{place:id,first});
    if(first){
      state.citizen.xp+=40;
      state.citizen.level=calcLevel(state.citizen.xp);
      if(Object.keys(visits).length>=5 && !state.citizen.artifacts.includes("EXPLORER")) state.citizen.artifacts.push("EXPLORER");
    }
    return save();
  }

  function setMode(id){
    if(validPlace(id)) state.citizen.mode=id;
    return save();
  }

  function setForm(form){
    const allowed=["likeness","stylized","fictional","privacy"];
    if(allowed.includes(form)) state.citizen.form=form;
    return save();
  }

  function setCitizen(input){
    if(input && typeof input==="object"){
      const name=clean(input.name,40);
      const initial=clean(input.initial,2).toUpperCase();
      if(name) state.citizen.name=name;
      if(initial) state.citizen.initial=initial;
    }
    return save();
  }

  function toggleList(listName,value){
    const list=state.world[listName];
    if(!Array.isArray(list)) return snapshot();
    const index=list.indexOf(value);
    if(index>=0) list.splice(index,1); else list.push(value);
    timeline("toggle",{list:listName,value,active:index<0});
    return save();
  }

  function insertEntity(input,options){
    const entity=entityRecord(input,state.citizen.id);
    if(state.world.entities[entity.id]) return state.world.entities[entity.id];
    if(entity.parentEntityId && !state.world.entities[entity.parentEntityId]) entity.parentEntityId=null;
    state.world.entities[entity.id]=entity;
    if(options && options.append) state.world.entityOrder.push(entity.id);
    else state.world.entityOrder.unshift(entity.id);
    return entity;
  }

  function createEntity(input){
    const entity=insertEntity(input);
    timeline("entity_created",{id:entity.id,placeId:entity.placeId,entityType:entity.entityType});
    state.citizen.xp+=50;
    state.citizen.level=calcLevel(state.citizen.xp);
    save();
    return clone(entity);
  }

  function getEntity(id){
    const entity=state.world.entities[id];
    return entity ? clone(entity) : null;
  }

  function listEntities(placeId,parentEntityId){
    return state.world.entityOrder
      .map(id=>state.world.entities[id])
      .filter(Boolean)
      .filter(entity=>!placeId || entity.placeId===placeId)
      .filter(entity=>parentEntityId===undefined || entity.parentEntityId===(parentEntityId||null))
      .map(clone);
  }

  function updateEntity(id,patch){
    const entity=state.world.entities[id];
    if(!entity || !patch || typeof patch!=="object") return null;
    if(patch.title!==undefined) entity.title=clean(patch.title,120)||entity.title;
    if(patch.summary!==undefined) entity.summary=clean(patch.summary,1000);
    if(patch.status!==undefined) entity.status=clean(patch.status,80)||entity.status;
    if(["public","members","invite","private"].includes(patch.visibility)) entity.visibility=patch.visibility;
    if(patch.metadata && typeof patch.metadata==="object" && !Array.isArray(patch.metadata)) entity.metadata=Object.assign({},entity.metadata,clone(patch.metadata));
    entity.updatedAt=now();
    timeline("entity_updated",{id:entity.id});
    save();
    return clone(entity);
  }

  function setEntityMembership(entityId,status,role){
    if(!state.world.entities[entityId]) return snapshot();
    const allowed=["invited","requested","active","muted","left","removed","interested","following"];
    const nextStatus=allowed.includes(status) ? status : "active";
    state.world.entityMemberships[entityId]={
      entityId,
      citizenId:state.citizen.id,
      role:clean(role,80)||"member",
      status:nextStatus,
      updatedAt:now()
    };
    timeline("entity_membership",{entityId,status:nextStatus,role:state.world.entityMemberships[entityId].role});
    state.citizen.xp+=nextStatus==="active" ? 20 : 5;
    state.citizen.level=calcLevel(state.citizen.xp);
    return save();
  }

  function getEntityMembership(entityId){
    const membership=state.world.entityMemberships[entityId];
    return membership ? clone(membership) : null;
  }

  function linkEntities(fromEntityId,toEntityId,linkType){
    if(!state.world.entities[fromEntityId] || !state.world.entities[toEntityId]) return null;
    const type=clean(linkType,80)||"related";
    const existing=state.world.entityLinks.find(link=>link.fromEntityId===fromEntityId && link.toEntityId===toEntityId && link.linkType===type);
    if(existing) return clone(existing);
    const link={id:uid("link"),fromEntityId,toEntityId,linkType:type,createdAt:now()};
    state.world.entityLinks.unshift(link);
    timeline("entities_linked",{fromEntityId,toEntityId,linkType:type});
    save();
    return clone(link);
  }

  function linksForEntity(entityId){
    return state.world.entityLinks
      .filter(link=>link.fromEntityId===entityId || link.toEntityId===entityId)
      .map(clone);
  }

  function createPlan(title,meta){
    const cleanTitle=clean(title,100);
    if(!cleanTitle) return snapshot();
    const id=uid("plan");
    const createdAt=now();
    const plan={id,title:cleanTitle,status:"forming",createdAt,meta:meta||{}};
    state.world.plans.unshift(plan);
    insertEntity({
      id,
      placeId:"plans",
      entityType:"plan",
      title:cleanTitle,
      summary:clean(meta&&meta.summary,1000),
      status:"forming",
      metadata:Object.assign({},meta||{},{legacyPlanId:id}),
      createdAt
    });
    timeline("plan_created",{id,title:cleanTitle});
    state.citizen.xp+=60;
    state.citizen.level=calcLevel(state.citizen.xp);
    return save();
  }

  function promotePlanToEvent(entityId){
    const plan=state.world.entities[entityId];
    if(!plan || plan.placeId!=="plans") return null;

    const existingLink=state.world.entityLinks.find(link=>link.fromEntityId===entityId && link.linkType==="became_event");
    if(existingLink) return getEntity(existingLink.toEntityId);

    const event=insertEntity({
      placeId:"events",
      entityType:"event",
      title:plan.title,
      summary:plan.summary||"Created from a NETIZENS Plan.",
      visibility:plan.visibility,
      metadata:Object.assign({},plan.metadata,{originPlanId:plan.id})
    });
    const circle=insertEntity({
      placeId:"circles",
      entityType:"circle",
      parentEntityId:event.id,
      title:plan.title+" Organizers",
      summary:"Private organizer space created with the Event.",
      visibility:"invite",
      metadata:{originEventId:event.id}
    });

    state.world.entityLinks.unshift(
      {id:uid("link"),fromEntityId:plan.id,toEntityId:event.id,linkType:"became_event",createdAt:now()},
      {id:uid("link"),fromEntityId:event.id,toEntityId:circle.id,linkType:"organizer_circle",createdAt:now()}
    );
    plan.status="converted";
    plan.updatedAt=now();
    state.world.entityMemberships[event.id]={entityId:event.id,citizenId:state.citizen.id,role:"host",status:"active",updatedAt:now()};
    state.world.entityMemberships[circle.id]={entityId:circle.id,citizenId:state.citizen.id,role:"organizer",status:"active",updatedAt:now()};
    timeline("plan_promoted",{planId:plan.id,eventId:event.id,circleId:circle.id});
    if(!state.citizen.artifacts.includes("CONVERTER")) state.citizen.artifacts.push("CONVERTER");
    state.citizen.xp+=100;
    state.citizen.level=calcLevel(state.citizen.xp);
    save();
    return clone(event);
  }

  function transformEntity(entityId,targetPlace,options){
    const source=state.world.entities[entityId];
    if(!source || !validPlace(targetPlace)) return null;
    const value=options&&typeof options==="object" ? options : {};
    const target=insertEntity({
      placeId:targetPlace,
      entityType:clean(value.entityType,80)||targetPlace.slice(0,-1),
      title:clean(value.title,120)||source.title,
      summary:clean(value.summary,1000)||source.summary,
      visibility:value.visibility||source.visibility,
      metadata:Object.assign({},value.metadata||{},{sourceEntityId:source.id})
    });
    state.world.entityLinks.unshift({
      id:uid("link"),
      fromEntityId:source.id,
      toEntityId:target.id,
      linkType:clean(value.linkType,80)||"transformed_into",
      createdAt:now()
    });
    timeline("entity_transformed",{sourceEntityId:source.id,targetEntityId:target.id,targetPlace});
    state.citizen.xp+=75;
    state.citizen.level=calcLevel(state.citizen.xp);
    save();
    return clone(target);
  }

  function vote(questionId,choice){
    state.world.yesNoVotes[questionId]={choice,at:now()};
    timeline("yes_no_vote",{questionId,choice});
    state.citizen.xp+=10;
    state.citizen.level=calcLevel(state.citizen.xp);
    return save();
  }

  function saveRoute(objective,route){
    const item={id:uid("route"),objective:String(objective||"").slice(0,240),route:Array.from(route||[]),createdAt:now()};
    state.world.savedRoutes.unshift(item);
    state.world.savedRoutes=state.world.savedRoutes.slice(0,20);
    timeline("route_saved",{id:item.id,route:item.route});
    state.citizen.xp+=30;
    state.citizen.level=calcLevel(state.citizen.xp);
    return save();
  }

  function savePerceptionBinding(binding){
    const value=binding && typeof binding==="object" ? binding : {};
    const item={
      id:uid("binding"),
      projectId:clean(value.projectId,160)||null,
      objectiveId:clean(value.objectiveId,160)||null,
      routeId:clean(value.routeId,160)||null,
      sourcePlaceId:clean(value.sourcePlaceId,120)||null,
      sourceEntityId:clean(value.sourceEntityId,180)||null,
      reason:clean(value.reason,2000),
      nodeCount:Array.isArray(value.nodes) ? value.nodes.length : 0,
      status:clean(value.status,80)||"route_proposed",
      createdAt:now()
    };
    state.world.perceptionBindings.unshift(item);
    state.world.perceptionBindings=state.world.perceptionBindings.slice(0,50);
    timeline("perception_binding",{id:item.id,routeId:item.routeId,status:item.status,sourceEntityId:item.sourceEntityId});
    state.citizen.xp+=40;
    state.citizen.level=calcLevel(state.citizen.xp);
    return save();
  }

  function futureScenario(horizon){
    const horizons={
      "6m":{label:"+6 MONTHS",factor:1},
      "1y":{label:"+1 YEAR",factor:2},
      "5y":{label:"+5 YEARS",factor:6}
    };
    const h=horizons[horizon]||horizons["6m"];
    const visited=Object.keys(state.world.visitedPlaces).length;
    const plans=listEntities("plans").length;
    const projects=listEntities("projects").length;
    const events=listEntities("events").length;
    const entities=Object.keys(state.world.entities).length;
    const links=state.world.entityLinks.length;
    const memberships=Object.values(state.world.entityMemberships).filter(item=>item&&["active","interested","following"].includes(item.status)).length;
    const routes=state.world.savedRoutes.length+state.world.perceptionBindings.length;
    const base=hash(state.citizen.markSeed+"|"+horizon+"|"+visited+"|"+entities+"|"+links+"|"+routes);
    const growth=Math.max(1,Math.round((visited+entities+links+memberships+routes+1)*h.factor*.55));
    const connections=12+growth*2+(base%17);
    const completed=Math.max(1,Math.round((projects+plans+1)*h.factor*.72));
    const hosted=Math.max(0,Math.round((events+plans+1)*h.factor*.45));
    const newPlaces=Math.min(10,Math.max(2,Math.round(2+h.factor+(base%3))));

    return {
      horizon,
      label:h.label,
      disclaimer:"Scenario, not prediction.",
      headline:horizon==="5y" ? "Your network became infrastructure." : horizon==="1y" ? "Your places started connecting themselves." : "Momentum is visible.",
      metrics:[
        {label:"Meaningful connections",value:String(connections)},
        {label:"Projects / plans completed",value:String(completed)},
        {label:"Events hosted",value:String(hosted)},
        {label:"Places actively used",value:String(Math.min(10,visited+newPlaces))}
      ],
      moments:[
        memberships ? "Some of your memberships became durable communities." : "Your first durable membership formed around shared intent.",
        plans ? "A Plan crossed into Events and created a new organizer layer." : "A spontaneous Plan became your first recurring Event.",
        links ? "Objects in different Places began carrying context between one another." : "Your first cross-Place connection changed how the World fit together.",
        routes ? "Perception reused verified context instead of making you start over." : "Perception learned which World context matters to your objectives."
      ]
    };
  }

  function reset(){
    localStorage.removeItem(LEGACY_KEY);
    state=normalize(null);
    save();
    return snapshot();
  }

  window.NetizensStore={
    snapshot,save,reset,seed,hash,awardXP,addArtifact,visitPlace,setMode,setForm,setCitizen,
    toggleList,createPlan,vote,saveRoute,savePerceptionBinding,futureScenario,
    createEntity,getEntity,listEntities,updateEntity,setEntityMembership,getEntityMembership,
    linkEntities,linksForEntity,promotePlanToEvent,transformEntity
  };
})();