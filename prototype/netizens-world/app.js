const placeData = {
  commons:{name:"Commons",symbol:"◎",color:"#8a68ff",bg:"#271f55",tag:"PUBLIC CONVERSATION",desc:"The open square. Follow conversations, not an outrage treadmill.",items:["What is everyone talking about?","City skylines never get old.","A public square with memory and context."],chips:["For You","Following","Topics","World"]},
  crews:{name:"Crews",symbol:"⚑",color:"#ff9d5c",bg:"#4b2b21",tag:"YOUR PEOPLE",desc:"Smaller groups built around interests, identity, campuses and doing things together.",items:["Trail Seekers","Film & Creators","Game Night Crew"],chips:["College Groups","Hobbies","Sports","Art","Tech"]},
  local:{name:"Local",symbol:"⌖",color:"#49d7ff",bg:"#123f51",tag:"AROUND YOU",desc:"Nearby people, events, useful local knowledge and spontaneous plans.",items:["Sunset Yoga in the Park · tomorrow","Pickup basketball · tonight","Who knows a good bike shop?"],chips:["People","Events","Businesses","Crews"]},
  projects:{name:"Projects",symbol:"◇",color:"#59e79b",bg:"#173d31",tag:"BUILD TOGETHER",desc:"Turn conversation into work with collaborators, milestones and visible progress.",items:["Community Garden","Indie Film Series","Neighborhood Cleanup"],chips:["Active","Explore","Your Projects"]},
  ask:{name:"Ask",symbol:"?",color:"#f3d568",bg:"#4b3d19",tag:"REAL ANSWERS",desc:"Questions routed toward people who know, with useful context and follow-up.",items:["Best way to start a local film club?","Affordable video editing setup?","How do I find my first developer?"],chips:["Tech","Health","Money","Life"]},
  exchange:{name:"Exchange",symbol:"⇄",color:"#e879ff",bg:"#4a2251",tag:"SKILLS + HELP",desc:"Trade knowledge, time, favors and collaboration without turning everything into a marketplace.",items:["Portrait photography offered","Looking for website design help","Resume review available"],chips:["Skills","Equipment","Services","Time"]},
  circles:{name:"Circles",symbol:"◉",color:"#698cff",bg:"#223260",tag:"PRIVATE SPACES",desc:"Trusted group conversation with people you actually know or deliberately invite.",items:["Best Friends","Project Organizers","Film Crew"],chips:["Your Circles","Invites","Conversations"]},
  events:{name:"Events",symbol:"✦",color:"#ff668f",bg:"#512238",tag:"BE THERE",desc:"Things happening at a specific time and place: planned, spontaneous, public or private.",items:["Rooftop Concert · Saturday","Art Walk · Sunday","Pickup Basketball · Tuesday"],chips:["Today","This Week","This Month","Near You"]},
  plans:{name:"Plans",symbol:"↗",color:"#ffb157",bg:"#56331c",tag:"ANYBODY WANT TO...?",desc:"Plans begin before events. Start with an idea and find people who want to do it with you.",items:["Try the new ramen place Friday","Museum Saturday afternoon","Watch the game tonight"],chips:["Tonight","Weekend","Friends","Nearby"]},
  yesno:{name:"Yes or No",symbol:"◐",color:"#63e89b",bg:"#173d35",tag:"QUICK DECISIONS",desc:"One question. Two choices. Make your position clear.",items:[],chips:["Now","Local","Friends","World"]}
};

const placePresentation = {
  commons:{lead:"The conversation starts here.",heading:"Public spaces",note:"An open square for conversations and shared context."},
  crews:{lead:"Find the people you click with.",heading:"Groups to explore",note:"Smaller spaces built around something you share."},
  local:{lead:"A little closer to home.",heading:"Local spaces",note:"Nearby discovery is not connected in this preview. These examples do not use your location."},
  projects:{lead:"Make something that matters.",heading:"Project workspace",note:"Open a project to explore its work, discussion and connected spaces."},
  ask:{lead:"A good question opens a door.",heading:"Questions to explore",note:"Open a question to read or add to its discussion."},
  exchange:{lead:"Something to offer. Something to find.",heading:"Exchange spaces",note:"Skills, knowledge and useful help. No checkout or payment is connected here."},
  circles:{lead:"Keep your people close.",heading:"Your private spaces",note:"Circle conversations use a separate trusted system. Public discussion is disabled inside Circles."},
  events:{lead:"Be there for something.",heading:"Events to explore",note:"Open an event to see its details and mark your interest. Example listings are not verified live events."},
  plans:{lead:"Anybody want to…?",heading:"Plans taking shape",note:"Start with an idea. An existing plan can become an event when you are ready."},
  yesno:{lead:"Where do you stand?",heading:"Make your choice",note:"One question. Two choices."}
};
function renderPlaceHero(id){
  const p=placeData[id],theme=placePresentation[id];
  const mark=id==="yesno" ? "<span>YES</span><span>NO</span>" : p.symbol;
  return "<header class='place-hero'><div class='place-intro'><p class='kicker'>"+escapeHtml(p.tag)+"</p><h1>"+escapeHtml(p.name)+"</h1><p class='place-lead'>"+escapeHtml(theme.lead)+"</p><p class='place-description'>"+escapeHtml(p.desc)+"</p></div><div class='place-emblem' aria-hidden='true'>"+mark+"</div></header>";
}

const state = { depth:[{type:"world",label:"WORLD"}], currentPlace:null, currentEntityId:null, routeOrigin:null };
const surface = document.getElementById("surfaceApp");
const world = document.getElementById("worldApp");
const mapView = document.getElementById("worldMap");
const placeView = document.getElementById("placeView");
const depthTrail = document.getElementById("depthTrail");
const citizenPanel = document.getElementById("citizenPanel");
const perceptionPanel = document.getElementById("perceptionPanel");
const timeDialog = document.getElementById("timeMachineDialog");
const store = window.NetizensData || window.NetizensStore;
const perception = window.NetizensPerception || null;
let lastRoute = null;
const worldPresence = window.NetizensWorldPresence || null;

function emit(event,data){
  // Local discussion UI uses a separate event; privacy-gated analytics carry
  // no route, identity or place data while presence is disconnected/private.
  if(event==="entity_view"){
    window.dispatchEvent(new CustomEvent("netizens:entity-view",{detail:{entity_id:data && data.entity_id || null}}));
  }
  if(!worldPresence || !worldPresence.previewState().livePresenceConnected || !worldPresence.mayShareMovement()) return;
  window.dispatchEvent(new CustomEvent("netizens:analytics",{detail:Object.assign({event:event,at:new Date().toISOString()},data||{})}));
}

// Layout is a display preference only; all Place buttons retain their existing routes.

function setWorldLayout(layout){
  mapView.dataset.layout = layout;
  document.querySelectorAll("[data-world-layout]").forEach(function(button){
    button.setAttribute("aria-pressed",String(button.dataset.worldLayout===layout));
  });
  document.getElementById("cityNavigationHint").hidden=layout!=="city";
  if(layout==="city") requestAnimationFrame(centerWorldCity);
  if(worldPresence)requestAnimationFrame(function(){worldPresence.relayout();});
}
function centerWorldCity(){
  const viewport=document.querySelector(".world-scene-viewport");
  viewport.scrollLeft=(viewport.scrollWidth-viewport.clientWidth)/2;
  viewport.scrollTop=Math.max(0,(viewport.scrollHeight-viewport.clientHeight)*.45);
}
setWorldLayout("city");

function showWorld(){
  surface.classList.add("hidden"); world.classList.remove("hidden"); renderCitizen(); if(worldPresence)worldPresence.start(); emit("world_enter"); showMap();
}
function exitWorld(){
  emit("world_exit"); if(worldPresence)worldPresence.stop(); world.classList.add("hidden"); surface.classList.remove("hidden"); closePanels();
}
function showMap(){
  state.depth=[{type:"world",label:"WORLD"}]; state.currentPlace=null; state.currentEntityId=null; state.routeOrigin=null;
  mapView.classList.add("active"); placeView.classList.remove("active");
  renderDepth(); if(worldPresence)worldPresence.returnToMap(); document.getElementById("worldMain").focus({preventScroll:true}); if(mapView.dataset.layout==="city") requestAnimationFrame(centerWorldCity); emit("world_map_view");
}
function renderDepth(){
  depthTrail.innerHTML = "";
  state.depth.forEach(function(item,index){
    var b=document.createElement("button"); b.textContent=item.label; b.dataset.depthIndex=String(index); depthTrail.appendChild(b);
  });
}
function pushDepth(label,type){
  state.depth.push({type:type||"room",label:label.toUpperCase()}); renderDepth();
  var panel=document.querySelector(".nested-state");
  if(panel){ panel.innerHTML="<p class='kicker'>DEEPER LAYER</p><h3>"+escapeHtml(label)+"</h3><p class='muted'>You are now inside a place within a place. Your Citizen identity and permissions travel with you.</p><button class='place-action' data-pop-depth>GO UP ONE LAYER</button>"; }
  emit("depth_enter",{label:label});
}
function popDepthTo(index){
  if(index===state.depth.length-1) return;
  if(index===0) return showMap();
  var target=state.depth[index];
  state.depth=state.depth.slice(0,index+1); renderDepth();
  if(target && target.type==="entity") return openEntity(target.id,true);
  var placeItem=state.depth.find(function(x){return x.type==="place";});
  if(placeItem) openPlace(placeItem.id,true);
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c];}); }

function getTodayKey(){ var d=new Date(); return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(); }
function seed(){
  var s=localStorage.getItem("netizens_world_seed");
  if(!s){ s=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)); localStorage.setItem("netizens_world_seed",s); }
  return s;
}
function hash(s){ var h=2166136261; for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return h>>>0; }
function timeMachinePlace(){
  var ids=Object.keys(placeData).filter(function(id){return id!=="yesno";});
  return ids[hash(seed()+"|"+getTodayKey())%ids.length];
}
function showTimeDoor(id){ return localStorage.getItem("netizens_tm_found")!==getTodayKey() && id===timeMachinePlace(); }

function renderEntityCards(placeId){
  if(!store.listEntities) return "";
  var entities=store.listEntities(placeId,null).filter(function(entity){return !(placeId==="crews" && entity.metadata && entity.metadata.kind==="college_group");});
  if(!entities.length) return "<div class='entity-empty'>Nothing has taken shape here yet.</div>";
  return "<div class='entity-grid'>"+entities.map(function(entity){
    var membership=store.getEntityMembership ? store.getEntityMembership(entity.id) : null;
    var status=membership && membership.status && !["left","removed"].includes(membership.status) ? membership.status : entity.status;
    return "<button class='entity-card' data-open-entity='"+escapeHtml(entity.id)+"'>"
      +"<span class='entity-type'>"+escapeHtml(entity.entityType)+"</span>"
      +"<strong>"+escapeHtml(entity.title)+"</strong>"
      +"<p>"+escapeHtml(entity.summary||"Enter this layer of the World.")+"</p>"
      +"<small>"+escapeHtml(status||"active")+" · "+escapeHtml(entity.visibility||"public")+"</small>"
      +"</button>";
  }).join("")+"</div>";
}

function renderCollegeGroupsPilot(){
  if(!store.listEntities) return "";
  var groups=store.listEntities("crews",null).filter(function(entity){
    return entity.metadata && entity.metadata.kind==="college_group";
  });
  if(!groups.length) return "";
  return "<section class='college-pilot'>"
    +"<div class='college-pilot-head'><div><p class='kicker'>COLLEGE GROUPS · PILOT</p><h3>Start on campus. Test real usage.</h3><p class='muted'>Seeded campus spaces for students to connect around campus life, issues, projects, events, and civic participation. These cards do not claim current political activity or membership.</p></div><span class='pilot-badge'>DMV TEST</span></div>"
    +"<div class='college-grid'>"+groups.map(function(entity){
      return "<button class='college-card' data-open-entity='"+escapeHtml(entity.id)+"'>"
        +"<span class='college-state'>PILOT GROUP</span>"
        +"<strong>"+escapeHtml(entity.title)+"</strong>"
        +"<p>"+escapeHtml((entity.metadata&&entity.metadata.campus)||entity.title)+"</p>"
        +"<small>OPEN CAMPUS GROUP →</small>"
        +"</button>";
    }).join("")+"</div>"
    +"</section>";
}

function entityActionMarkup(entity){
  var membership=store.getEntityMembership ? store.getEntityMembership(entity.id) : null;
  var active=membership && !["left","removed"].includes(membership.status);
  var actions=[];

  if(entity.placeId==="crews" || entity.placeId==="circles"){
    actions.push("<button class='place-action' data-entity-membership='"+escapeHtml(entity.id)+"' data-active-status='active'>"+(active?"LEAVE":"JOIN")+"</button>");
  }
  if(entity.placeId==="projects"){
    actions.push("<button class='place-action' data-entity-membership='"+escapeHtml(entity.id)+"' data-active-status='following'>"+(active?"UNFOLLOW":"FOLLOW")+"</button>");
  }
  if(entity.placeId==="events"){
    actions.push("<button class='place-action' data-entity-membership='"+escapeHtml(entity.id)+"' data-active-status='interested'>"+(active?"REMOVE INTEREST":"I'M INTERESTED")+"</button>");
  }
  if(entity.placeId==="plans" && entity.status!=="converted"){
    actions.push("<button class='place-action transform-action' data-promote-plan='"+escapeHtml(entity.id)+"'>TURN PLAN INTO EVENT</button>");
  }
  if(entity.placeId==="ask"){
    actions.push("<button class='place-action transform-action' data-transform-entity='"+escapeHtml(entity.id)+"' data-target-place='projects'>TURN THIS INTO A PROJECT</button>");
  }

  actions.push("<button class='place-action secondary-action' data-perception-entity='"+escapeHtml(entity.id)+"'>ASK PERCEPTION FROM HERE</button>");
  return actions.join("");
}

function openEntity(id,preserveDepth){
  if(!store.getEntity) return;
  var entity=store.getEntity(id); if(!entity)return;
  var p=placeData[entity.placeId]||placeData.commons;
  state.currentPlace=entity.placeId;
  placeView.dataset.place=entity.placeId;
  if(worldPresence)worldPresence.atPlace(entity.placeId);
  state.currentEntityId=entity.id;
  state.routeOrigin=entity.placeId;
  store.setMode(entity.placeId);
  renderCitizen();

  if(!preserveDepth){
    state.depth=[
      {type:"world",label:"WORLD"},
      {type:"place",id:entity.placeId,label:p.name.toUpperCase()},
      {type:"entity",id:entity.id,label:entity.title.toUpperCase()}
    ];
  }

  mapView.classList.remove("active"); placeView.classList.add("active"); renderDepth();
  placeView.dataset.placeTheme=state.currentPlace;
  placeView.dataset.view=state.currentEntityId ? "entity" : "place";
  placeView.style.setProperty("--place-color",p.color);
  placeView.style.setProperty("--place-bg",p.bg);
  placeView.style.setProperty("--place-glow",p.color+"33");

  var links=store.linksForEntity ? store.linksForEntity(entity.id) : [];
  var linked=links.map(function(link){
    var otherId=link.fromEntityId===entity.id ? link.toEntityId : link.fromEntityId;
    var other=store.getEntity(otherId);
    if(!other)return "";
    return "<button class='entity-link' data-open-entity='"+escapeHtml(other.id)+"'><span>"+escapeHtml(link.linkType.replace(/_/g," "))+"</span><strong>"+escapeHtml(other.title)+"</strong><small>"+escapeHtml((placeData[other.placeId]||{}).name||other.placeId)+"</small></button>";
  }).join("");

  var children=store.listEntities ? store.listEntities(null,entity.id) : [];
  var childMarkup=children.map(function(child){
    return "<button class='entity-link' data-open-entity='"+escapeHtml(child.id)+"'><span>inside</span><strong>"+escapeHtml(child.title)+"</strong><small>"+escapeHtml((placeData[child.placeId]||{}).name||child.placeId)+"</small></button>";
  }).join("");

  var membership=store.getEntityMembership ? store.getEntityMembership(entity.id) : null;
  var pathNote=membership ? "<p class='entity-membership-note'>YOUR STATUS · "+escapeHtml(membership.status.toUpperCase())+" · "+escapeHtml(membership.role.toUpperCase())+"</p>" : "";

  placeView.innerHTML=
    "<section class='entity-hero'>"
      +"<div><p class='kicker'>"+escapeHtml(p.name.toUpperCase())+" · "+escapeHtml(entity.entityType.toUpperCase())+"</p>"
      +"<h1>"+escapeHtml(entity.title)+"</h1>"
      +"<p>"+escapeHtml(entity.summary||"A living object inside NETIZENS World.")+"</p>"+pathNote+"</div>"
      +"<div class='entity-symbol'>"+p.symbol+"</div>"
    +"</section>"
    +"<div class='entity-layout'>"
      +"<section class='panel'><h3>THIS LAYER</h3><div class='entity-facts'><span>STATUS <b>"+escapeHtml(entity.status)+"</b></span><span>VISIBILITY <b>"+escapeHtml(entity.visibility)+"</b></span><span>PLACE <b>"+escapeHtml(p.name)+"</b></span></div>"+entityActionMarkup(entity)+"</section>"
      +"<aside class='panel'><h3>CONNECTED LAYERS</h3>"+(linked||childMarkup?linked+childMarkup:"<p class='muted'>Nothing connected yet. Connections appear when this object becomes something else or creates a deeper layer.</p>")+"</aside>"
    +"</div>";

  emit("entity_view",{entity_id:entity.id,place:entity.placeId,entity_type:entity.entityType});
  if(entity.metadata && entity.metadata.kind==="college_group") emit("college_group_view",{entity_id:entity.id,campus:entity.metadata.campus||entity.title,region:entity.metadata.region||null});
}

function openPlace(id,preserveDepth){
  var p=placeData[id]; if(!p)return;
  state.currentPlace=id;
  placeView.dataset.place=id;
  if(worldPresence)worldPresence.atPlace(id);
  state.currentEntityId=null;
  store.visitPlace(id);
  store.setMode(id);
  renderCitizen();
  if(!preserveDepth){ state.depth=[{type:"world",label:"WORLD"},{type:"place",id:id,label:p.name.toUpperCase()}]; }
  mapView.classList.remove("active"); placeView.classList.add("active"); renderDepth();
  placeView.dataset.placeTheme=state.currentPlace;
  placeView.dataset.view=state.currentEntityId ? "entity" : "place";
  placeView.style.setProperty("--place-color",p.color);
  placeView.style.setProperty("--place-bg",p.bg);
  placeView.style.setProperty("--place-glow",p.color+"33");

  var content="";
  if(id==="yesno"){
    content="<section class='panel yesno-stage' aria-labelledby='decisionQuestion'><p class='kicker'>EXAMPLE QUESTION</p><h2 id='decisionQuestion'>Should group chats have an expiration date?</h2><p class='decision-intro'>A clear choice. Your own point of view.</p><div class='vote-row' role='group' aria-label='Your choice'><button class='vote yes' data-vote='yes' aria-pressed='false'><span class='vote-sign' aria-hidden='true'>✓</span><strong>YES</strong><small>Let them end.</small></button><button class='vote no' data-vote='no' aria-pressed='false'><span class='vote-sign' aria-hidden='true'>×</span><strong>NO</strong><small>Keep them going.</small></button></div><div id='voteResult' class='vote-result' role='status'>Community results are not available in this local prototype.</div></section>";
  } else {
    var activities=p.items.map(function(x){return "<div class='activity'><strong>"+escapeHtml(x)+"</strong><span>Example content · not live activity</span></div>";}).join("");
    var entities=renderEntityCards(id);
    var collegePilot=id==="crews"?renderCollegeGroupsPilot():"";
    var composer=id==="plans"
      ? "<div class='plan-composer'><label for='planTitle'>START A PLAN</label><div><input id='planTitle' maxlength='100' placeholder='Anybody want to...'><button data-create-plan>CREATE</button></div></div>"
      : "";
    content="<div class='place-grid'><section class='panel place-primary'>"+composer+"<h3>"+escapeHtml(placePresentation[id].heading)+"</h3>"+collegePilot+entities+"<details class='place-examples'><summary>Illustrative examples</summary>"+activities+"</details></section><aside class='panel place-guide'><h3>"+escapeHtml(p.tag)+"</h3><p class='place-guide-note'>"+escapeHtml(placePresentation[id].note)+"</p><div class='chip-row'>"+p.chips.map(function(c){return "<span class='chip'>"+escapeHtml(c)+"</span>";}).join("")+"</div><button class='place-action' data-perception-from='"+id+"'>ASK PERCEPTION TO CONNECT THIS PLACE</button><div class='nested-state'></div></aside></div>";
  }

  var door=showTimeDoor(id)?"<button class='time-door' id='timeDoor'><small>◌ SIGNAL DETECTED</small><strong>TIME MACHINE</strong><span>It wasn't here yesterday.</span></button>":"";
  placeView.innerHTML=renderPlaceHero(id)+content+door;
  if(window.NetizensWorldSecrets)window.NetizensWorldSecrets.mountPlace(id,placeView);

  emit("place_view",{place:id,time_machine_surface:showTimeDoor(id)});
  if(id==="yesno") renderLocalVote();
  if(id==="crews") emit("college_groups_pilot_impression",{pilot:"dmv",seeded_groups:5});
}

function openTimeMachine(){
  localStorage.setItem("netizens_tm_found",getTodayKey());
  var door=document.getElementById("timeDoor"); if(door) door.remove();
  store.addArtifact("TIME TRAVELER");
  renderCitizen();
  timeDialog.showModal();
  renderFutureScenario("6m");
  emit("time_machine_open",{from:state.currentPlace});
}
function renderLocalVote(){
  var result=document.getElementById("voteResult"); if(!result)return;
  var saved=(store.snapshot().world.yesNoVotes||{})["group-chat-expiration"];
  document.querySelectorAll("[data-vote]").forEach(function(button){
    const selected=Boolean(saved && saved.choice===button.dataset.vote);
    button.classList.toggle("is-selected",selected);button.setAttribute("aria-pressed",String(selected));
  });
  result.textContent=saved ? "Your "+saved.choice.toUpperCase()+" choice is saved on this device. Community results are not available." : "Community results are not available in this local prototype.";
}
function vote(choice){
  store.vote("group-chat-expiration",choice);
  renderLocalVote();
  renderCitizen();
  emit("yes_no_vote",{choice:choice});
}
function closePanels(){
  [citizenPanel,perceptionPanel].forEach(function(p){p.classList.remove("open");p.setAttribute("aria-hidden","true");});
}
function openPanel(panel){
  closePanels(); panel.classList.add("open"); panel.setAttribute("aria-hidden","false");
}
function previewMode(id){
  var p=placeData[id]; if(!p)return;
  store.setMode(id);
  document.getElementById("citizenAvatar").style.setProperty("--mode",p.color);
  renderCitizen();
  emit("avatar_place_mode_preview",{place:id});
}
function computeWorldRoute(text){
  var q=String(text||"").toLowerCase(); var route=[];
  function add(id){if(placeData[id] && route.indexOf(id)<0) route.push(id);}
  if(state.routeOrigin && placeData[state.routeOrigin]) add(state.routeOrigin);
  if(/local|near|nearby|neighborhood|city|around here|moved|location/.test(q)) add("local");
  if(/friend|people|crew|club|group|team|basketball|film|gaming|hiking|community|college|campus|student|university/.test(q)) add("crews");
  if(/build|make|create|start|project|app|business|produce|film/.test(q)) add("projects");
  if(/tonight|saturday|sunday|event|concert|meetup|game|schedule|host/.test(q)) add("events");
  if(/want to|anybody|someone to|dinner|restaurant|museum|watch|plan/.test(q)) add("plans");
  if(/ask|know|how|advice|recommend|question/.test(q)) add("ask");
  if(/help|skill|teach|trade|photographer|designer|developer|exchange/.test(q)) add("exchange");
  if(/private|trusted|organizer|organise|organize/.test(q)) add("circles");
  if(/yes or no|vote|poll|decide/.test(q)) add("yesno");
  if(!route.length){add("commons");add("ask");}
  return route;
}

function renderPerceptionStatus(){
  var node=document.getElementById("perceptionStatus"); if(!node)return;
  var live=perception && perception.status ? perception.status() : {configured:false};
  node.textContent=live.configured ? "PERCEPTION LIVE" : "LOCAL PREVIEW";
  node.classList.toggle("live",Boolean(live.configured));
}

function renderWorldRoute(route){
  return "<div class='route-path'>"+route.map(function(id,i){return (i?"<b>→</b>":"")+"<span>"+escapeHtml(placeData[id].name)+"</span>";}).join("")+"</div>";
}

function renderRouteActions(route){
  return "<div class='route-actions'>"+route.map(function(id){
    return "<button class='place-action' data-open-route='"+escapeHtml(id)+"'>Open "+escapeHtml(placeData[id].name)+"</button>";
  }).join("")+"<button class='place-action secondary-action' data-save-route>Save these suggestions</button></div>";
}

function renderUsefulActions(){
  return "<section class='route-next-steps' aria-label='Things you can do'>"
    +"<h3>Take a next step</h3>"
    +"<button class='place-action' data-start-plan>Start a plan</button>"
    +"<button class='place-action secondary-action' data-open-route='crews'>Explore groups</button>"
    +"<button class='place-action secondary-action' data-open-route='ask'>Browse questions</button>"
    +"<p class='muted small-copy'>This preview saves your changes on this device. Example groups and questions are not evidence of a live community.</p></section>";
}

function renderLocalRoute(raw,route,error){
  var box=document.getElementById("routeResult");
  box.innerHTML=(error?"<div class='perception-warning'>Live Perception was unavailable: "+escapeHtml(error)+"</div>":"")
    +"<p class='route-mode'>PLACES TO EXPLORE</p>"
    +renderWorldRoute(route)
    +"<p class='route-note'><strong>Objective:</strong> "+escapeHtml(raw)+"<br>These are suggestions. Nothing has been run or shared.</p>"
    +renderUsefulActions()
    +renderRouteActions(route);
}

async function routeIntent(){
  var input=document.getElementById("intentInput");
  var raw=input.value.trim();
  var box=document.getElementById("routeResult");
  if(raw.length<3){
    box.innerHTML="<p class='perception-warning'>Describe what you want to do first.</p>";
    return;
  }

  var localRoute=computeWorldRoute(raw);
  lastRoute={objective:raw,route:localRoute.slice(),live:false};
  box.innerHTML="<div class='perception-loading'>Mapping objective through Perception…</div>";
  renderPerceptionStatus();

  var live=perception && perception.status ? perception.status() : {configured:false};
  if(live.configured){
    try{
      var snap=store.snapshot();
      var result=await perception.submit(raw,{
        placeId:state.routeOrigin||state.currentPlace||"",
        entityId:state.currentEntityId||"",
        snapshotHash:String(store.hash(JSON.stringify(snap)))
      });

      if(result && result.ok){
        var routeEvidence=(result.nodes||[]).map(function(node){return (node.label||"")+" "+(node.outcome||"");}).join(" ");
        var worldRoute=computeWorldRoute(raw+" "+routeEvidence);
        lastRoute={
          objective:raw,
          route:worldRoute.slice(),
          live:true,
          projectId:result.projectId,
          objectiveId:result.objectiveId,
          routeId:result.routeId,
          nodes:result.nodes||[]
        };

        if(store.savePerceptionBinding){
          store.savePerceptionBinding({
            projectId:result.projectId,
            objectiveId:result.objectiveId,
            routeId:result.routeId,
            sourcePlaceId:state.routeOrigin||state.currentPlace||null,
            sourceEntityId:state.currentEntityId||null,
            reason:result.reason||"",
            nodes:result.nodes||[],
            status:"route_proposed"
          });
        }

        var nodes=(result.nodes||[]).map(function(node,index){
          return "<div class='perception-node'><div><span>"+String(index+1).padStart(2,"0")+"</span><strong>"+escapeHtml(node.label||node.key||"Route step")+"</strong></div><p>"+escapeHtml(node.outcome||"")+"</p><small>"+escapeHtml(node.capability||"reason")+" · "+escapeHtml(node.permissionLevel||"P0")+" · "+escapeHtml(node.risk||"low")+" risk</small></div>";
        }).join("");

        box.innerHTML="<p class='route-mode live-route'>PERCEPTION LIVE</p>"
          +renderWorldRoute(worldRoute)
          +"<p class='route-note'><strong>Objective:</strong> "+escapeHtml(raw)+"<br>"+escapeHtml(result.reason||"Perception produced a bounded route.")+"</p>"
          +(nodes?"<div class='perception-nodes'>"+nodes+"</div>":"")
          +"<p class='permission-note'>This is a proposed route. Any action beyond the runtime's allowed scope remains subject to Perception permissions and verification.</p>"
          +renderUsefulActions()
          +renderRouteActions(worldRoute);

        renderCitizen();
        emit("perception_live_route",{objective:raw,route:worldRoute,route_id:result.routeId,node_count:(result.nodes||[]).length});
        return;
      }

      renderLocalRoute(raw,localRoute,result && result.error ? result.error : "Unknown live-routing error");
      emit("perception_live_fallback",{objective:raw});
      return;
    }catch(error){
      renderLocalRoute(raw,localRoute,error instanceof Error ? error.message : "Request failed");
      emit("perception_live_fallback",{objective:raw});
      return;
    }
  }

  renderLocalRoute(raw,localRoute);
  emit("perception_route_preview",{objective:raw,route:localRoute});
}

function renderSyncStatus(){
  var badge=document.getElementById("syncBadge"); if(!badge || !store.getSyncStatus) return;
  var status=store.getSyncStatus();
  badge.textContent=status.mode==="transport-ready" ? (status.pending ? "SYNC "+status.pending : "SYNCED") : (status.pending ? "LOCAL "+status.pending : "LOCAL-FIRST");
  badge.classList.toggle("pending",status.pending>0);
}

function renderCitizen(){
  renderSyncStatus();
  var snap=store.snapshot();
  var citizen=snap.citizen;
  var current=placeData[citizen.mode]||placeData.commons;
  var activityNode=document.getElementById("citizenActivity");
  var mini=document.getElementById("avatarMini");
  var avatar=document.getElementById("citizenAvatar");
  var nameNode=document.getElementById("citizenName");
  if(activityNode){
    var visits=Object.keys(snap.world.visitedPlaces||{}).length;
    var plans=Array.isArray(snap.world.plans) ? snap.world.plans.length : 0;
    activityNode.textContent=visits+" place"+(visits===1?"":"s")+" explored · "+plans+" local plan"+(plans===1?"":"s");
  }
  if(mini) mini.textContent=citizen.initial;
  if(avatar){avatar.style.setProperty("--mode",current.color);avatar.dataset.form=citizen.form||"stylized";var s=avatar.querySelector("span");if(s)s.textContent=citizen.initial;}
  document.querySelectorAll("[data-avatar-form]").forEach(function(btn){btn.classList.toggle("active",btn.dataset.avatarForm===(citizen.form||"stylized"));});
  if(nameNode) nameNode.textContent=citizen.name;
}

function renderFutureScenario(horizon){
  var scenario=store.futureScenario(horizon);
  document.querySelectorAll("[data-horizon]").forEach(function(btn){btn.classList.toggle("active",btn.dataset.horizon===horizon);});
  var box=document.getElementById("futureScenario"); if(!box)return;
  box.innerHTML="<div class='future-heading'><span>"+scenario.label+"</span><strong>"+escapeHtml(scenario.headline)+"</strong><small>"+scenario.disclaimer+"</small></div><div class='future-metrics'>"+scenario.metrics.map(function(m){return "<div><strong>"+escapeHtml(m.value)+"</strong><span>"+escapeHtml(m.label)+"</span></div>";}).join("")+"</div><div class='future-moments'>"+scenario.moments.map(function(m){return "<p>◌ "+escapeHtml(m)+"</p>";}).join("")+"</div>";
  emit("time_machine_scenario",{horizon:horizon});
}

document.addEventListener("click",function(e){
  var layout=e.target.closest("[data-world-layout]");
  if(layout){setWorldLayout(layout.dataset.worldLayout);return;}
  if(e.target.closest("[data-start-plan]")){closePanels();openPlace("plans");document.getElementById("planTitle").focus();return;}
  var p=e.target.closest("button.island[data-place]"); if(p){if(worldPresence && mapView.classList.contains("active"))return worldPresence.travelTo(p.dataset.place,function(){openPlace(p.dataset.place);});return openPlace(p.dataset.place);}

  var d=e.target.closest("[data-depth-index]"); if(d)return popDepthTo(Number(d.dataset.depthIndex));
  var nested=e.target.closest("[data-enter-depth]"); if(nested)return pushDepth(nested.dataset.enterDepth);
  if(e.target.closest("[data-pop-depth]")){ if(state.depth.length>2){state.depth.pop();renderDepth();openPlace(state.currentPlace,true);} return; }
  var openEntityBtn=e.target.closest("[data-open-entity]"); if(openEntityBtn){closePanels();return openEntity(openEntityBtn.dataset.openEntity);}
  var membershipBtn=e.target.closest("[data-entity-membership]"); if(membershipBtn){var current=store.getEntityMembership(membershipBtn.dataset.entityMembership);var next=current && !["left","removed"].includes(current.status) ? "left" : (membershipBtn.dataset.activeStatus||"active");var membershipEntity=store.getEntity(membershipBtn.dataset.entityMembership);store.setEntityMembership(membershipBtn.dataset.entityMembership,next,next==="following"?"follower":next==="interested"?"attendee":"member");if(membershipEntity && membershipEntity.metadata && membershipEntity.metadata.kind==="college_group")emit("college_group_membership",{entity_id:membershipEntity.id,campus:membershipEntity.metadata.campus||membershipEntity.title,status:next});renderCitizen();return openEntity(membershipBtn.dataset.entityMembership,true);}
  var promoteBtn=e.target.closest("[data-promote-plan]"); if(promoteBtn){var eventEntity=store.promotePlanToEvent(promoteBtn.dataset.promotePlan);renderCitizen();if(eventEntity&&eventEntity.id)return openEntity(eventEntity.id);return;}
  var transformBtn=e.target.closest("[data-transform-entity]"); if(transformBtn){var transformed=store.transformEntity(transformBtn.dataset.transformEntity,transformBtn.dataset.targetPlace,{linkType:"became_project",entityType:"project"});renderCitizen();if(transformed&&transformed.id)return openEntity(transformed.id);return;}
  var entityPerception=e.target.closest("[data-perception-entity]"); if(entityPerception){var sourceEntity=store.getEntity(entityPerception.dataset.perceptionEntity);if(sourceEntity){state.currentEntityId=sourceEntity.id;state.routeOrigin=sourceEntity.placeId;renderPerceptionStatus();openPanel(perceptionPanel);document.getElementById("intentInput").value="Help me move "+sourceEntity.title+" forward."; }return;}
  var voteBtn=e.target.closest("[data-vote]"); if(voteBtn)return vote(voteBtn.dataset.vote);
  var horizon=e.target.closest("[data-horizon]"); if(horizon)return renderFutureScenario(horizon.dataset.horizon);
  var createPlan=e.target.closest("[data-create-plan]"); if(createPlan){var input=document.getElementById("planTitle");var title=input?input.value.trim():"";if(title){store.createPlan(title,{source:"plans"});store.addArtifact("PLANNER");renderCitizen();openPlace("plans",true);}return;}
  var worldAction=e.target.closest("[data-world-action]"); if(worldAction){store.toggleList(worldAction.dataset.list,worldAction.dataset.value);renderCitizen();openPlace(state.currentPlace,true);return;}
  if(e.target.closest("[data-save-route]")){if(lastRoute){store.saveRoute(lastRoute.objective,lastRoute.route);store.addArtifact("ROUTE MAKER");renderCitizen();var saveBtn=e.target.closest("[data-save-route]");saveBtn.textContent="Suggestions saved on this device";saveBtn.disabled=true;}return;}
  if(e.target.closest("#timeDoor"))return openTimeMachine();
  var close=e.target.closest("[data-close-panel]"); if(close){var panel=document.getElementById(close.dataset.closePanel);panel.classList.remove("open");panel.setAttribute("aria-hidden","true");return;}
  var mode=e.target.closest("[data-preview-mode]"); if(mode)return previewMode(mode.dataset.previewMode);
  var form=e.target.closest("[data-avatar-form]"); if(form){store.setForm(form.dataset.avatarForm);store.addArtifact("SHAPESHIFTER");renderCitizen();emit("avatar_form_change",{form:form.dataset.avatarForm});return;}
  var from=e.target.closest("[data-perception-from]"); if(from){state.currentEntityId=null;state.routeOrigin=from.dataset.perceptionFrom;renderPerceptionStatus();openPanel(perceptionPanel);document.getElementById("intentInput").value="Help me do something useful from "+placeData[from.dataset.perceptionFrom].name+".";return;}
  var route=e.target.closest("[data-open-route]"); if(route){closePanels();return openPlace(route.dataset.openRoute);}
});

document.getElementById("enterWorld").addEventListener("click",showWorld);
document.getElementById("exitWorld").addEventListener("click",exitWorld);
document.getElementById("worldHome").addEventListener("click",showMap);
document.getElementById("openCitizen").addEventListener("click",function(){openPanel(citizenPanel);});
document.getElementById("openPerception").addEventListener("click",function(){state.routeOrigin=state.currentPlace||null;renderPerceptionStatus();openPanel(perceptionPanel);});
document.getElementById("routeIntent").addEventListener("click",routeIntent);
document.getElementById("closeTimeMachine").addEventListener("click",function(){timeDialog.close();});
timeDialog.addEventListener("click",function(e){if(e.target===timeDialog)timeDialog.close();});
timeDialog.addEventListener("close",function(){emit("time_machine_close");});

var mark=document.getElementById("citizenMark"); mark.style.setProperty("--turn",(hash(seed())%90)+"deg");
window.addEventListener("netizens:sync-state",renderSyncStatus);
window.addEventListener("netizens:perception-config",renderPerceptionStatus);
renderCitizen();
renderPerceptionStatus();
emit("surface_view");