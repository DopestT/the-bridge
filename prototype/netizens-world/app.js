const placeData = {
  commons:{name:"Commons",symbol:"◎",color:"#8a68ff",bg:"#271f55",tag:"PUBLIC CONVERSATION",desc:"The open square. Follow conversations, not an outrage treadmill.",items:["What is everyone talking about?","City skylines never get old.","A public square with memory and context."],chips:["For You","Following","Topics","World"]},
  crews:{name:"Crews",symbol:"⚑",color:"#ff9d5c",bg:"#4b2b21",tag:"YOUR PEOPLE",desc:"Smaller groups built around interests, identity and doing things together.",items:["Trail Seekers · 1.8K members","Film & Creators · 2.4K members","Game Night Crew · 892 members"],chips:["Hobbies","Sports","Art","Tech"]},
  local:{name:"Local",symbol:"⌖",color:"#49d7ff",bg:"#123f51",tag:"AROUND YOU",desc:"Nearby people, events, useful local knowledge and spontaneous plans.",items:["Sunset Yoga in the Park · tomorrow","Pickup basketball · tonight","Who knows a good bike shop?"],chips:["People","Events","Businesses","Crews"]},
  projects:{name:"Projects",symbol:"◇",color:"#59e79b",bg:"#173d31",tag:"BUILD TOGETHER",desc:"Turn conversation into work with collaborators, milestones and visible progress.",items:["Community Garden · 70%","Indie Film Series · 40%","Neighborhood Cleanup · 20%"],chips:["Active","Explore","Your Projects"]},
  ask:{name:"Ask",symbol:"?",color:"#f3d568",bg:"#4b3d19",tag:"REAL ANSWERS",desc:"Questions routed toward people who know, with useful context and follow-up.",items:["Best way to start a local film club?","Affordable video editing setup?","How do I find my first developer?"],chips:["Tech","Health","Money","Life"]},
  exchange:{name:"Exchange",symbol:"⇄",color:"#e879ff",bg:"#4a2251",tag:"SKILLS + HELP",desc:"Trade knowledge, time, favors and collaboration without turning everything into a marketplace.",items:["Portrait photography offered","Looking for website design help","Resume review available"],chips:["Skills","Equipment","Services","Time"]},
  circles:{name:"Circles",symbol:"◉",color:"#698cff",bg:"#223260",tag:"PRIVATE SPACES",desc:"Trusted group conversation with people you actually know or deliberately invite.",items:["Best Friends · 5 members","Project Organizers · 8 members","Film Crew · 12 members"],chips:["Your Circles","Invites","Active Now"]},
  events:{name:"Events",symbol:"✦",color:"#ff668f",bg:"#512238",tag:"BE THERE",desc:"Things happening at a specific time and place: planned, spontaneous, public or private.",items:["Rooftop Concert · Saturday","Art Walk · Sunday","Pickup Basketball · Tuesday"],chips:["Today","This Week","This Month","Near You"]},
  plans:{name:"Plans",symbol:"↗",color:"#ffb157",bg:"#56331c",tag:"ANYBODY WANT TO...?",desc:"Plans begin before events. Start with an idea and find people who want to do it with you.",items:["Try the new ramen place Friday","Museum Saturday afternoon","Watch the game tonight"],chips:["Tonight","Weekend","Friends","Nearby"]},
  yesno:{name:"Yes or No",symbol:"◐",color:"#63e89b",bg:"#173d35",tag:"QUICK DECISIONS",desc:"One question. Two choices. Vote first, then see the room.",items:[],chips:["Now","Local","Friends","World"]}
};

const state = { depth:[{type:"world",label:"WORLD"}], currentPlace:null };
const surface = document.getElementById("surfaceApp");
const world = document.getElementById("worldApp");
const mapView = document.getElementById("worldMap");
const placeView = document.getElementById("placeView");
const depthTrail = document.getElementById("depthTrail");
const citizenPanel = document.getElementById("citizenPanel");
const perceptionPanel = document.getElementById("perceptionPanel");
const timeDialog = document.getElementById("timeMachineDialog");

function emit(event,data){ window.dispatchEvent(new CustomEvent("netizens:analytics",{detail:Object.assign({event:event,at:new Date().toISOString()},data||{})})); }

function showWorld(){
  surface.classList.add("hidden"); world.classList.remove("hidden"); showMap(); emit("world_enter");
}
function exitWorld(){
  world.classList.add("hidden"); surface.classList.remove("hidden"); closePanels(); emit("world_exit");
}
function showMap(){
  state.depth=[{type:"world",label:"WORLD"}]; state.currentPlace=null;
  mapView.classList.add("active"); placeView.classList.remove("active");
  renderDepth(); document.getElementById("worldMain").focus({preventScroll:true}); emit("world_map_view");
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
  if(index===0) return showMap();
  state.depth=state.depth.slice(0,index+1); renderDepth();
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

function openPlace(id,preserveDepth){
  var p=placeData[id]; if(!p)return;
  state.currentPlace=id;
  if(!preserveDepth){ state.depth=[{type:"world",label:"WORLD"},{type:"place",id:id,label:p.name.toUpperCase()}]; }
  mapView.classList.remove("active"); placeView.classList.add("active"); renderDepth();
  placeView.style.setProperty("--place-color",p.color);
  placeView.style.setProperty("--place-bg",p.bg);
  placeView.style.setProperty("--place-glow",p.color+"33");

  var content="";
  if(id==="yesno"){
    content="<section class='panel yesno-stage'><p class='kicker'>QUESTION NOW</p><h2>Should group chats have an expiration date?</h2><div class='vote-row'><button class='vote yes' data-vote='yes'>YES</button><button class='vote no' data-vote='no'>NO</button></div><div id='voteResult' class='vote-result'>Results stay hidden until you vote.</div></section>";
  } else {
    var activities=p.items.map(function(x,i){return "<div class='activity'><strong>"+escapeHtml(x)+"</strong><span>"+(i+2)+" people active now · context travels with you</span></div>";}).join("");
    var nested="";
    if(id==="crews") nested="<div class='nested-card'><strong>Film & Creators</strong><span class='muted'>A Crew can contain rooms, plans and projects.</span><button data-enter-depth='Film & Creators Crew'>ENTER CREW</button></div>";
    if(id==="projects") nested="<div class='nested-card'><strong>Indie Film Series</strong><span class='muted'>32 members · 40% complete</span><button data-enter-depth='Indie Film Series Project'>ENTER PROJECT</button></div>";
    if(id==="plans") nested="<div class='nested-card'><strong>Ramen Friday</strong><span class='muted'>4 interested · becomes an Event when time + place lock.</span><button data-enter-depth='Ramen Friday Plan'>OPEN PLAN</button></div>";
    content="<div class='place-grid'><section class='panel'><h3>Happening here</h3>"+activities+nested+"</section><aside class='panel'><h3>"+escapeHtml(p.tag)+"</h3><div class='chip-row'>"+p.chips.map(function(c){return "<span class='chip'>"+escapeHtml(c)+"</span>";}).join("")+"</div><button class='place-action' data-perception-from='"+id+"'>ASK PERCEPTION TO CONNECT THIS PLACE</button><div class='nested-state'></div></aside></div>";
  }

  var door=showTimeDoor(id)?"<button class='time-door' id='timeDoor'><small>◌ SIGNAL DETECTED</small><strong>TIME MACHINE</strong><span>It wasn't here yesterday.</span></button>":"";
  placeView.innerHTML="<section class='place-hero'><div><p class='kicker'>"+escapeHtml(p.tag)+"</p><h1>"+escapeHtml(p.name)+"</h1><p>"+escapeHtml(p.desc)+"</p></div><div class='place-symbol'>"+p.symbol+"</div></section>"+content+door;
  emit("place_view",{place:id,time_machine_surface:showTimeDoor(id)});
}

function openTimeMachine(){
  localStorage.setItem("netizens_tm_found",getTodayKey()); timeDialog.showModal(); emit("time_machine_open",{from:state.currentPlace});
}
function vote(choice){
  var r=document.getElementById("voteResult"); if(!r)return;
  r.innerHTML=choice==="yes"?"<strong style='color:#91f3bb'>YES 62%</strong> · NO 38% — now explain why.":"YES 62% · <strong style='color:#ff99a8'>NO 38%</strong> — now explain why.";
  emit("yes_no_vote",{choice:choice});
}
function closePanels(){
  [citizenPanel,perceptionPanel].forEach(function(p){p.classList.remove("open");p.setAttribute("aria-hidden","true");});
}
function openPanel(panel){
  closePanels(); panel.classList.add("open"); panel.setAttribute("aria-hidden","false");
}
function previewMode(id){
  var p=placeData[id]; if(!p)return; document.getElementById("citizenAvatar").style.setProperty("--mode",p.color); emit("avatar_place_mode_preview",{place:id});
}
function routeIntent(){
  var raw=document.getElementById("intentInput").value.trim();
  var q=raw.toLowerCase(); var route=[];
  function add(id){if(route.indexOf(id)<0)route.push(id);}
  if(/local|near|nearby|neighborhood|city|around here|moved/.test(q)) add("local");
  if(/friend|people|crew|club|group|team|basketball|film|gaming|hiking/.test(q)) add("crews");
  if(/build|make|create|start|project|app|business|film/.test(q)) add("projects");
  if(/tonight|saturday|sunday|event|concert|meetup|game/.test(q)) add("events");
  if(/want to|anybody|someone to|dinner|restaurant|museum|watch/.test(q)) add("plans");
  if(/ask|know|how|advice|recommend/.test(q)) add("ask");
  if(/help|skill|teach|trade|photographer|designer|developer/.test(q)) add("exchange");
  if(!route.length){add("commons");add("ask");}
  var box=document.getElementById("routeResult");
  box.innerHTML="<div class='route-path'>"+route.map(function(id,i){return (i?"<b>→</b>":"")+"<span>"+placeData[id].name+"</span>";}).join("")+"</div><p class='route-note'><strong>Objective:</strong> "+escapeHtml(raw||"No objective entered.")+"<br>Perception would ask permission before creating, inviting or publishing anything.</p><button class='place-action' data-open-route='"+route[0]+"'>OPEN FIRST PLACE</button>";
  emit("perception_route",{objective:raw,route:route});
}

document.addEventListener("click",function(e){
  var p=e.target.closest("[data-place]"); if(p)return openPlace(p.dataset.place);
  var d=e.target.closest("[data-depth-index]"); if(d)return popDepthTo(Number(d.dataset.depthIndex));
  var nested=e.target.closest("[data-enter-depth]"); if(nested)return pushDepth(nested.dataset.enterDepth);
  if(e.target.closest("[data-pop-depth]")){ if(state.depth.length>2){state.depth.pop();renderDepth();openPlace(state.currentPlace,true);} return; }
  var voteBtn=e.target.closest("[data-vote]"); if(voteBtn)return vote(voteBtn.dataset.vote);
  if(e.target.closest("#timeDoor"))return openTimeMachine();
  var close=e.target.closest("[data-close-panel]"); if(close){document.getElementById(close.dataset.closePanel).classList.remove("open");return;}
  var mode=e.target.closest("[data-preview-mode]"); if(mode)return previewMode(mode.dataset.previewMode);
  var from=e.target.closest("[data-perception-from]"); if(from){openPanel(perceptionPanel);document.getElementById("intentInput").value="Help me do something useful from "+placeData[from.dataset.perceptionFrom].name+".";return;}
  var route=e.target.closest("[data-open-route]"); if(route){closePanels();return openPlace(route.dataset.openRoute);}
});

document.getElementById("enterWorld").addEventListener("click",showWorld);
document.getElementById("exitWorld").addEventListener("click",exitWorld);
document.getElementById("worldHome").addEventListener("click",showMap);
document.getElementById("openCitizen").addEventListener("click",function(){openPanel(citizenPanel);});
document.getElementById("openPerception").addEventListener("click",function(){openPanel(perceptionPanel);});
document.getElementById("routeIntent").addEventListener("click",routeIntent);
document.getElementById("closeTimeMachine").addEventListener("click",function(){timeDialog.close();emit("time_machine_close");});
timeDialog.addEventListener("click",function(e){if(e.target===timeDialog)timeDialog.close();});

var mark=document.getElementById("citizenMark"); mark.style.setProperty("--turn",(hash(seed())%90)+"deg");
emit("surface_view");