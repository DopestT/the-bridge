(function(){
  "use strict";

  // Original local-only curiosities, not member activity, badges with financial value,
  // engagement statistics, or an online account.
  const STORAGE="netizens_world_found_signals_v1";
  const SIGNALS={
    commons:{symbol:"◎",name:"The First Echo",story:"A quiet message shimmers: every conversation starts with someone willing to listen."},
    crews:{symbol:"⚑",name:"A Spare Key",story:"A key with no lock. Sometimes finding your people means building the door together."},
    local:{symbol:"⌖",name:"Pocket Horizon",story:"A small folded horizon opens. Big ideas can begin close to home."},
    projects:{symbol:"◇",name:"Blueprint Zero",story:"A blueprint marked NOT YET glows like the first line of something wonderful."},
    ask:{symbol:"?",name:"The Unanswered Question",story:"Somewhere, a question waits for someone curious enough to ask it again."},
    exchange:{symbol:"⇄",name:"The Empty Hand",story:"Two hands trade a spark and somehow both walk away with more light."},
    circles:{symbol:"◉",name:"The Quiet Door",story:"A hidden door opens only when everyone inside agrees it should."},
    events:{symbol:"✦",name:"The Afterglow Ticket",story:"The ticket says: the night has ended. The glow says: not quite."},
    plans:{symbol:"↗",name:"Tomorrow's Map",story:"A dotted line across a tiny map: not a promise, just an invitation."},
    yesno:{symbol:"◐",name:"The Third Door",story:"Between YES and NO, someone has scratched: TELL ME MORE."}
  };
  const ids=Object.keys(SIGNALS);
  const dialog=document.getElementById("worldSecretDialog");
  const foundCount=document.getElementById("worldSecretCount");
  const foundNames=document.getElementById("worldSecretCollection");
  const title=document.getElementById("worldSecretTitle");
  const narrative=document.getElementById("worldSecretStory");
  const epilogue=document.getElementById("worldSecretEpilogue");
  const close=document.getElementById("worldSecretClose");
  let found=new Set();
  let previousFocus=null;
  try {
    const value=JSON.parse(localStorage.getItem(STORAGE)||"[]");
    if(Array.isArray(value))found=new Set(value.filter(function(id){return Object.hasOwn(SIGNALS,id)}));
  }catch(_){found=new Set();}

  function save() {
    try {localStorage.setItem(STORAGE,JSON.stringify(ids.filter(function(id){return found.has(id)})));}catch(_){}
  }
  function renderCollection() {
    if(foundCount)foundCount.textContent=found.size+" of "+ids.length+" hidden signals discovered · this device only";
    if(foundNames) {
      foundNames.replaceChildren();
      ids.forEach(function(id){
        const item=document.createElement("li");
        item.textContent=found.has(id) ? SIGNALS[id].name : "Undiscovered signal";
        foundNames.appendChild(item);
      });
    }
  }
  function reveal(place) {
    if(!Object.hasOwn(SIGNALS,place)||!dialog)return;
    previousFocus=document.activeElement;
    const item=SIGNALS[place];
    const newlyFound=!found.has(place);
    found.add(place);
    if(newlyFound)save();
    title.textContent=item.symbol+" "+item.name;
    narrative.textContent=item.story;
    epilogue.textContent=found.size===ids.length
      ? "A CONSTELLATION FORMS · Ten quiet details now belong to your private collection."
      : (newlyFound?"A NEW DETAIL":"AN OLD DETAIL, SEEN AGAIN")+" · "+found.size+" of "+ids.length+" noticed";
    dialog.showModal();
    renderCollection();
    if(close)close.focus();
  }
  function mountPlace(place,container) {
    if(!Object.hasOwn(SIGNALS,place)||!container)return;
    const hero=container.querySelector(".place-hero");
    if(!hero||hero.querySelector(".world-secret-trigger"))return;
    const button=document.createElement("button");
    button.type="button";
    button.className="world-secret-trigger";
    button.dataset.secretPlace=place;
    button.textContent="✧";
    button.title="A curious glimmer";
    button.setAttribute("aria-label","Discover a hidden signal in "+place);
    hero.appendChild(button);
  }
  if(close)close.addEventListener("click",function(){ dialog.close(); });
  if(dialog){
    dialog.addEventListener("click",function(e){if(e.target===dialog)dialog.close();});
    dialog.addEventListener("close",function(){
      if(previousFocus && previousFocus.isConnected && typeof previousFocus.focus==="function")previousFocus.focus();
      previousFocus=null;
    });
  }
  document.addEventListener("click",function(e){
    const trigger=e.target.closest("[data-secret-place]");
    if(trigger){e.stopPropagation();reveal(trigger.dataset.secretPlace);}
  });
  renderCollection();
  window.NetizensWorldSecrets={
    mountPlace:mountPlace,
    // For deterministic read-only QA; not a network profile or game economy.
    previewState:function(){return {foundCount:found.size,total:ids.length,foundPlaces:ids.filter(function(id){return found.has(id)}),deviceOnly:true};}
  };
}());