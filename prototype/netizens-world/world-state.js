(function(){
  "use strict";
  const KEY="netizens_world_state_v2";
  const SCHEMA_VERSION=2;

  function now(){ return new Date().toISOString(); }
  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function uid(prefix){
    const token=(globalThis.crypto && crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36);
    return (prefix||"id")+"_"+token;
  }
  function seed(){
    let s=localStorage.getItem("netizens_world_seed");
    if(!s){
      s=(globalThis.crypto && crypto.randomUUID)?crypto.randomUUID():Math.random().toString(36).slice(2);
      localStorage.setItem("netizens_world_seed",s);
    }
    return s;
  }
  function hash(str){
    let h=2166136261;
    for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
    return h>>>0;
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
      world:{
        visitedPlaces:{},
        joinedCrews:[],
        followedProjects:[],
        interestedEvents:[],
        plans:[],
        yesNoVotes:{},
        savedRoutes:[],
        timeline:[]
      }
    };
  }
  function normalize(raw){
    const base=defaultState();
    if(!raw || typeof raw!=="object") return base;
    const state=Object.assign(base,raw);
    state.citizen=Object.assign(base.citizen,raw.citizen||{});
    state.world=Object.assign(base.world,raw.world||{});
    state.version=SCHEMA_VERSION;
    return state;
  }
  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||"null");
      return normalize(raw);
    }catch(_){ return defaultState(); }
  }
  let state=load();

  function save(){
    state.updatedAt=now();
    localStorage.setItem(KEY,JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("netizens:state",{detail:snapshot()}));
    return snapshot();
  }
  function snapshot(){ return clone(state); }
  function calcLevel(xp){ return Math.max(1,Math.floor(Number(xp||0)/500)+1); }
  function awardXP(amount,reason){
    const points=Math.max(0,Number(amount)||0);
    state.citizen.xp+=points;
    state.citizen.level=calcLevel(state.citizen.xp);
    if(reason) timeline("xp",{amount:points,reason:reason});
    return save();
  }
  function addArtifact(name){
    if(name && !state.citizen.artifacts.includes(name)) state.citizen.artifacts.push(name);
    return save();
  }
  function timeline(type,data){
    state.world.timeline.unshift({id:uid("moment"),type:type,at:now(),data:data||{}});
    state.world.timeline=state.world.timeline.slice(0,100);
  }
  function visitPlace(id){
    const visits=state.world.visitedPlaces;
    const first=!visits[id];
    visits[id]=Object.assign({count:0,firstVisitedAt:now()},visits[id]||{});
    visits[id].count+=1;
    visits[id].lastVisitedAt=now();
    timeline("place_visit",{place:id,first:first});
    if(first){
      state.citizen.xp+=40;
      state.citizen.level=calcLevel(state.citizen.xp);
      if(Object.keys(visits).length>=5 && !state.citizen.artifacts.includes("EXPLORER")) state.citizen.artifacts.push("EXPLORER");
    }
    return save();
  }
  function setMode(id){ state.citizen.mode=id; return save(); }
  function setForm(form){
    const allowed=["likeness","stylized","fictional","privacy"];
    if(allowed.includes(form)) state.citizen.form=form;
    return save();
  }
  function setCitizen(input){
    if(input && typeof input==="object"){
      if(input.name) state.citizen.name=String(input.name).slice(0,40);
      if(input.initial) state.citizen.initial=String(input.initial).slice(0,2).toUpperCase();
    }
    return save();
  }
  function toggleList(listName,value){
    const list=state.world[listName];
    if(!Array.isArray(list)) return snapshot();
    const i=list.indexOf(value);
    if(i>=0) list.splice(i,1); else list.push(value);
    timeline("toggle",{list:listName,value:value,active:i<0});
    return save();
  }
  function createPlan(title,meta){
    const clean=String(title||"").trim();
    if(!clean) return snapshot();
    const plan={id:uid("plan"),title:clean.slice(0,100),status:"forming",createdAt:now(),meta:meta||{}};
    state.world.plans.unshift(plan);
    timeline("plan_created",{id:plan.id,title:plan.title});
    state.citizen.xp+=60;
    state.citizen.level=calcLevel(state.citizen.xp);
    return save();
  }
  function vote(questionId,choice){
    state.world.yesNoVotes[questionId]={choice:choice,at:now()};
    timeline("yes_no_vote",{questionId:questionId,choice:choice});
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
  function futureScenario(horizon){
    const horizons={
      "6m":{label:"+6 MONTHS",factor:1},
      "1y":{label:"+1 YEAR",factor:2},
      "5y":{label:"+5 YEARS",factor:6}
    };
    const h=horizons[horizon]||horizons["6m"];
    const visited=Object.keys(state.world.visitedPlaces).length;
    const plans=state.world.plans.length;
    const routes=state.world.savedRoutes.length;
    const joined=state.world.joinedCrews.length;
    const projects=state.world.followedProjects.length;
    const base=hash(state.citizen.markSeed+"|"+horizon+"|"+visited+"|"+plans+"|"+routes);
    const growth=Math.max(1,Math.round((visited+plans+routes+joined+projects+1)*h.factor*1.4));
    const connections=12+growth*3+(base%17);
    const completed=Math.max(1,Math.round((projects+plans+1)*h.factor*.8));
    const hosted=Math.max(0,Math.round((plans+1)*h.factor*.55));
    const newPlaces=Math.min(10,Math.max(2,Math.round(2+h.factor+(base%3))));
    return {
      horizon:horizon,
      label:h.label,
      disclaimer:"Scenario, not prediction.",
      headline:horizon==="5y"?"Your network became infrastructure.":horizon==="1y"?"Your places started connecting themselves.":"Momentum is visible.",
      metrics:[
        {label:"Meaningful connections",value:String(connections)},
        {label:"Projects / plans completed",value:String(completed)},
        {label:"Events hosted",value:String(hosted)},
        {label:"Places actively used",value:String(Math.min(10,visited+newPlaces))}
      ],
      moments:[
        joined?"A Crew you joined became a recurring real-world community.":"Your first Crew formed around a shared interest.",
        plans?"One of your Plans matured into a recurring Event.":"A spontaneous Plan became your first recurring Event.",
        projects?"A followed Project spun off a new Crew.":"A Project connected you with people you did not know before.",
        routes?"Perception reused an approved route to reduce repeat setup.":"Perception learned which places you prefer to connect."
      ]
    };
  }
  function reset(){
    state=defaultState();
    save();
    return snapshot();
  }

  window.NetizensStore={
    snapshot,save,reset,seed,hash,awardXP,addArtifact,visitPlace,setMode,setCitizen,
    toggleList,createPlan,vote,saveRoute,futureScenario,setForm
  };
})();