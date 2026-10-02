const places = [
  {id:"commons",name:"Commons",icon:"◎",tag:"Public conversation",desc:"The open square. Talk, discover and follow what people are discussing.",accent:"rgba(124,92,255,.34)",bg:"linear-gradient(135deg,#382770,#171426)"},
  {id:"crews",name:"Crews",icon:"⚑",tag:"Your people",desc:"Smaller groups built around interests, identity and doing things together.",accent:"rgba(255,150,92,.30)",bg:"linear-gradient(135deg,#5a2e23,#171317)"},
  {id:"local",name:"Local",icon:"⌖",tag:"Around you",desc:"Nearby people, activity, events, useful local knowledge and spontaneous plans.",accent:"rgba(53,210,255,.30)",bg:"linear-gradient(135deg,#0f5262,#111b22)"},
  {id:"projects",name:"Projects",icon:"◇",tag:"Build something",desc:"Turn conversation into work. Find collaborators, milestones and momentum.",accent:"rgba(97,229,155,.26)",bg:"linear-gradient(135deg,#164b3a,#101c18)"},
  {id:"ask",name:"Ask",icon:"?",tag:"Real answers",desc:"Questions routed toward people who know, with context and useful follow-up.",accent:"rgba(255,217,98,.28)",bg:"linear-gradient(135deg,#5d4819,#1d190f)"},
  {id:"exchange",name:"Exchange",icon:"⇄",tag:"Skills + help",desc:"Trade knowledge, time, favors and collaboration without turning everything into a feed.",accent:"rgba(224,125,255,.28)",bg:"linear-gradient(135deg,#4b245d,#1a1220)"},
  {id:"circles",name:"Circles",icon:"◉",tag:"Private",desc:"Trusted group messaging and small-room conversation for people you actually know.",accent:"rgba(91,136,255,.28)",bg:"linear-gradient(135deg,#24345f,#111722)"},
  {id:"events",name:"Events",icon:"✦",tag:"Be there",desc:"Things happening at a time and place: planned, spontaneous, public or private.",accent:"rgba(255,100,145,.26)",bg:"linear-gradient(135deg,#5b2239,#1f1117)"},
  {id:"yesno",name:"Yes or No",icon:"◐",tag:"Decide fast",desc:"One question. Two choices. Vote first, then see what everyone else said.",accent:"rgba(97,229,155,.20)",bg:"linear-gradient(135deg,#173c39,#301924)"}
];

const content = {
  commons:["What is everyone talking about?","A public square, not an infinite treadmill.","Follow conversations, not outrage."],
  crews:["Weekend basketball","Builders after dark","Film people in the DMV"],
  local:["Pickup game tonight","Street festival this weekend","Who knows a good bike shop?"],
  projects:["Launch a neighborhood newsletter","Build a music video crew","Open-source transit map"],
  ask:["How do I find my first developer?","What makes a good community event?","Can anyone explain this contract clause?"],
  exchange:["Video editing ↔ guitar lessons","Need a photographer Saturday","Can help with resumes"],
  circles:["The group chat that stays yours","Trip planning","Close friends"],
  events:["Tonight near you","This weekend","Saved by your crews"]
};

const els = {
  home: document.getElementById("homeView"),
  place: document.getElementById("placeView"),
  grid: document.getElementById("placesGrid"),
  dialog: document.getElementById("timeMachineDialog"),
  close: document.getElementById("closeTimeMachine")
};

function emit(event, data={}) {
  const payload = {event, ...data, at:new Date().toISOString()};
  console.info("[NETIZENS analytics]", payload);
  window.dispatchEvent(new CustomEvent("netizens:analytics",{detail:payload}));
}

function hash(str) {
  let h = 2166136261;
  for (let i=0;i<str.length;i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h,16777619);
  }
  return h >>> 0;
}

function getVisitorSeed() {
  let seed = localStorage.getItem("netizens_tm_seed");
  if (!seed) {
    seed = crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
    localStorage.setItem("netizens_tm_seed",seed);
  }
  return seed;
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getTimeMachinePlace() {
  const seed = getVisitorSeed();
  const eligible = places.filter(p=>p.id!=="yesno");
  return eligible[hash(seed+"|"+getTodayKey()) % eligible.length].id;
}

function canSurfaceTimeMachine(placeId) {
  const foundToday = localStorage.getItem("netizens_tm_found") === getTodayKey();
  return !foundToday && placeId === getTimeMachinePlace();
}

function renderHome() {
  els.grid.innerHTML = places.map(p=>`
    <button class="place-card" data-open-place="${p.id}" style="--place-accent:${p.accent}">
      <div class="place-icon">${p.icon}</div>
      <h2>${p.name}</h2>
      <p>${p.desc}</p>
      <span class="place-meta">${p.tag.toUpperCase()}</span>
    </button>`).join("");
}

function setDockActive(placeId) {
  document.querySelectorAll(".dock-item").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.place===placeId || (!placeId && btn.hasAttribute("data-home")));
  });
}

function showHome() {
  els.place.classList.remove("active");
  els.home.classList.add("active");
  setDockActive(null);
  emit("home_view");
  document.getElementById("main").focus({preventScroll:true});
}

function timeDoorMarkup(placeId) {
  return `
    <button class="time-door" id="timeDoor" aria-label="Open Time Machine">
      <div class="signal"><span class="signal-dot"></span> SIGNAL DETECTED</div>
      <h3>TIME MACHINE</h3>
      <p>It wasn't here yesterday.</p>
    </button>`;
}

function normalPlaceMarkup(p) {
  const rows = content[p.id] || ["Something useful is happening here.","People are gathering around a purpose.","This place connects when it needs to."];
  return `
    <div class="place-hero" style="--place-bg:${p.bg}">
      <button class="back" data-home>← All places</button>
      <h1>${p.name}</h1>
      <p>${p.desc}</p>
    </div>
    <div class="place-content">
      <section class="panel">
        <h3>Happening here</h3>
        ${rows.map((r,i)=>`<div class="item"><strong>${r}</strong><span>${i+2} people are active now</span></div>`).join("")}
      </section>
      <aside class="panel">
        <h3>${p.tag}</h3>
        <div class="item"><strong>Different by design</strong><span>This place has its own behavior and culture.</span></div>
        <div class="item"><strong>Connected when useful</strong><span>Identity, messages and reputation travel with you.</span></div>
      </aside>
    </div>
    ${canSurfaceTimeMachine(p.id) ? timeDoorMarkup(p.id) : ""}`;
}

function yesNoMarkup(p) {
  return `
    <div class="place-hero" style="--place-bg:${p.bg}">
      <button class="back" data-home>← All places</button>
      <h1>Yes or No</h1>
      <p>Vote before seeing the room. Explanations come after the decision.</p>
    </div>
    <section class="panel yesno-stage">
      <div>
        <div class="eyebrow">QUESTION NOW</div>
        <h2 class="yesno-question">Should group chats have an expiration date?</h2>
        <div class="vote-row">
          <button class="vote yes" data-vote="yes">YES</button>
          <button class="vote no" data-vote="no">NO</button>
        </div>
        <div class="result" id="voteResult">Results stay hidden until you vote.</div>
      </div>
    </section>`;
}

function openPlace(id) {
  const p = places.find(x=>x.id===id);
  if (!p) return;
  els.home.classList.remove("active");
  els.place.classList.add("active");
  els.place.innerHTML = id==="yesno" ? yesNoMarkup(p) : normalPlaceMarkup(p);
  setDockActive(id);
  emit("place_view",{place:id,time_machine_surface:canSurfaceTimeMachine(id)});
  document.getElementById("main").focus({preventScroll:true});
}

function openTimeMachine() {
  localStorage.setItem("netizens_tm_found",getTodayKey());
  emit("time_machine_open",{from:getTimeMachinePlace()});
  els.dialog.showModal();
}

function vote(choice) {
  const result = document.getElementById("voteResult");
  if (!result) return;
  result.innerHTML = choice==="yes"
    ? "<strong>YES 62%</strong> · NO 38% — now you can explain why."
    : "YES 62% · <strong>NO 38%</strong> — now you can explain why.";
  emit("yes_no_vote",{choice});
}

document.addEventListener("click",e=>{
  const home = e.target.closest("[data-home]");
  if (home) return showHome();
  const open = e.target.closest("[data-open-place],[data-place]");
  if (open) return openPlace(open.dataset.openPlace || open.dataset.place);
  if (e.target.closest("#timeDoor")) return openTimeMachine();
  const voteBtn = e.target.closest("[data-vote]");
  if (voteBtn) return vote(voteBtn.dataset.vote);
});

els.close.addEventListener("click",()=>{
  els.dialog.close();
  emit("time_machine_close");
});
els.dialog.addEventListener("click",e=>{
  if (e.target===els.dialog) els.dialog.close();
});

renderHome();
showHome();
