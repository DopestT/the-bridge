(function () {
  "use strict";

  // Device-only preview. No GPS, user lookup, active-member fabrication, or network writes.
  // A production backend must provide authenticated, expiring, unlinked place-level presence
  // and enforce every sharing permission server-side before displaying anyone else.
  const PLACES = new Set(["commons","crews","local","projects","ask","exchange","circles","events","plans","yesno"]);
  const KEY = "netizens_world_presence_privacy_v1";
  const LAYER = document.getElementById("worldPresenceLayer");
  const BOARD = document.getElementById("placeWorld");
  const STATUS = document.getElementById("worldPresenceStatus");
  const identityToggle = document.getElementById("presenceIdentity");
  const followToggle = document.getElementById("presenceFollow");
  let currentPlace = "commons";
  let active = false;
  let traveling = false;
  let timer = null;
  let settings = {identityVisible:false, followMovement:false};
  // Four clearly disclosed synthetic preview actors. They are never counted as citizens.
  // No synthetic actor has an account, stable public identity, network presence or history.
  const DEMO_ROUTES = [
    ["crews", "commons", "events", "plans", "ask"],
    ["local", "projects", "exchange", "commons", "circles"],
    ["events", "ask", "local", "crews", "projects"],
    ["projects", "circles", "yesno", "exchange", "commons"]
  ];
  const demoBots = [];
  function hasReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }
  function demoVisible() {
    return active && document.getElementById("worldMap").classList.contains("active");
  }
  function placeDemo(bot, place, instant) {
    const point=coords(place);
    if (!point) return;
    // A small offset prevents multiple dots being drawn on top of each other.
    const offsets=[[-15,-12],[14,-13],[-15,14],[15,13]];
    const offset=offsets[bot.index];
    // Keep the fade brief even when the path movement takes 1.6 seconds.
    bot.element.style.transitionDuration=instant?"0ms,0ms,380ms":"1600ms,1600ms,380ms";
    bot.element.style.left=(point.x+offset[0])+"px";
    bot.element.style.top=(point.y+offset[1])+"px";
    bot.element.dataset.worldPlace=place;
  }
  function runDemo(bot) {
    if (!demoVisible() || hasReducedMotion()) return;
    bot.timer=setTimeout(function(){
      if (!demoVisible()) return;
      const next=(bot.step+1)%bot.route.length;
      placeDemo(bot,bot.route[next],false);
      bot.timer=setTimeout(function(){
        if (!demoVisible()) return;
        bot.element.style.opacity="0";
        bot.timer=setTimeout(function(){
          if (!demoVisible()) return;
          bot.step=next;
          placeDemo(bot,bot.route[bot.step],true);
          bot.element.style.opacity="1";
          runDemo(bot);
        },750);
      },1700);
    },650+bot.index*260);
  }
  function stopDemoBots() {
    demoBots.forEach(function(bot){ clearTimeout(bot.timer); bot.element.remove(); });
    demoBots.length=0;
  }
  function showDemoBots() {
    if (!demoVisible() || demoBots.length || !LAYER) return;
    DEMO_ROUTES.forEach(function(route,index){
      const element=document.createElement("span");
      element.className="presence-dot presence-dot--demo";
      element.setAttribute("aria-hidden","true");
      element.dataset.demo="true";
      LAYER.appendChild(element);
      const bot={index:index,element:element,route:route,step:0,timer:null};
      demoBots.push(bot);
      placeDemo(bot,route[0],true);
      if (!hasReducedMotion()) runDemo(bot);
    });
  }

  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || "{}");
    // Both options default off; movement sharing can never be on without identity consent.
    settings.identityVisible = stored.identityVisible === true;
    settings.followMovement = settings.identityVisible && stored.followMovement === true;
  } catch (_) { /* Missing/blocked storage means private defaults. */ }

  function syncSettings() {
    if (identityToggle) identityToggle.checked = settings.identityVisible;
    if (followToggle) {
      followToggle.checked = settings.followMovement;
      followToggle.disabled = !settings.identityVisible;
    }
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch (_) { /* Device-only. */ }
    syncSettings();
  }
  function coords(place) {
    if (!PLACES.has(place) || !BOARD) return null;
    const target = BOARD.querySelector('.island[data-place="' + place + '"]');
    if (!target) return null;
    const board = BOARD.getBoundingClientRect(), island = target.getBoundingClientRect();
    return {x:island.left - board.left + island.width / 2, y:island.top - board.top + island.height / 2};
  }
  function marker() {
    if (!LAYER) return null;
    let dot = LAYER.querySelector(".presence-dot--self");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "presence-dot presence-dot--self";
      dot.setAttribute("aria-hidden", "true");
      LAYER.appendChild(dot);
    }
    return dot;
  }
  function position(place, instant) {
    if (!active) return;
    const dot=marker(), point=coords(place);
    if (!dot || !point) return;
    dot.style.transitionDuration=instant?"0ms":"420ms";
    dot.style.left=point.x+"px";
    dot.style.top=point.y+"px";
    dot.dataset.worldPlace=place; // Device-local marker; no identifier or journey export.
  }
  function refresh() {
    if (STATUS) STATUS.textContent=active
      ? "YOUR DOT + 4 SIMULATED DOT BOTS · DEVICE ONLY · NO LIVE MEMBERS"
      : "4 SIMULATED DOT BOTS · LIVE COMMUNITY PRESENCE NOT CONNECTED";
    position(currentPlace,true);
  }
  function start() {
    active=true;
    refresh();
  }
  function stop() {
    active=false;
    traveling=false;
    stopDemoBots();
    if (timer!==null) clearTimeout(timer);
    timer=null;
    if (LAYER) LAYER.replaceChildren();
    refresh();
  }
  function returnToMap() {
    if (!active) return;
    position(currentPlace,true);
    showDemoBots();
  }
  function travelTo(place, arrive) {
    if (!PLACES.has(place) || typeof arrive !== "function") return;
    if (traveling) return;
    if (!active) { currentPlace=place; arrive(); return; }
    const reduceMotion=window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    traveling=true;
    position(currentPlace,true);
    // A frame gives the browser a chance to paint the departure dot.
    requestAnimationFrame(function(){
      if (!active) { traveling=false; return; }
      position(place,!!reduceMotion);
      timer=setTimeout(function(){
        currentPlace=place;
        traveling=false;
        timer=null;
        arrive();
      },reduceMotion?0:440);
    });
  }
  function atPlace(place) {
    if (!PLACES.has(place)) return;
    currentPlace=place;
    stopDemoBots();
    position(place,true);
  }
  function relayout() {
    if (!active) return;
    requestAnimationFrame(function(){
      if(!active)return;
      position(currentPlace,true);
      demoBots.forEach(function(bot){placeDemo(bot,bot.element.dataset.worldPlace || bot.route[bot.step],true);});
    });
  }
  function mayShareMovement() { return settings.identityVisible && settings.followMovement; }
  if (identityToggle) identityToggle.addEventListener("change",function(){
    settings.identityVisible=identityToggle.checked===true;
    if(!settings.identityVisible) settings.followMovement=false;
    persist();
  });
  if (followToggle) followToggle.addEventListener("change",function(){
    settings.followMovement=settings.identityVisible && followToggle.checked===true;
    persist();
  });
  window.addEventListener("resize",function(){
    if(active && !traveling)position(currentPlace,true);
    demoBots.forEach(function(bot){placeDemo(bot,bot.element.dataset.worldPlace || bot.route[bot.step],true);});
  });
  syncSettings();
  refresh();

  window.NetizensWorldPresence={
    start:start,stop:stop,atPlace:atPlace,returnToMap:returnToMap,relayout:relayout,travelTo:travelTo,refresh:refresh,
    mayShareMovement:mayShareMovement,
    // Read-only preview state for tests; never connect this module to a remote endpoint.
    previewState:function(){return {currentPlace:currentPlace,active:active,identityVisible:settings.identityVisible,followMovement:settings.followMovement,livePresenceConnected:false,demoBotCount:demoBots.length};}
  };
}());
