const puppeteer=require("puppeteer-core");
const url=process.env.NETIZENS_WORLD_PREVIEW_URL||"http://127.0.0.1:4198/prototype/netizens-world/index.html";
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",args:["--no-sandbox","--no-proxy-server","--proxy-bypass-list=*"]});
 let all=true;
 for(const [label,width,height] of [["desktop",1440,900],["tablet",768,1024],["phone",390,844],["small-phone",320,740]]){
  const page=await browser.newPage(),errors=[],external=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("request",r=>{if(!r.url().startsWith(new URL(url).origin))external.push(r.url())});
  await page.setViewport({width,height,deviceScaleFactor:1});
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>{window.__analytics=[];window.addEventListener("netizens:analytics",e=>window.__analytics.push(e.detail.event))});
  await page.click("#enterWorld");
  await page.waitForSelector(".city-art");
  await sleep(400);
  const initial=await page.evaluate(()=>{
   const board=document.querySelector("#placeWorld"),b=board.getBoundingClientRect(),dot=board.querySelector(".presence-dot--self"),place=board.querySelector('.island[data-place="commons"]').getBoundingClientRect();
   const cx=place.left-b.left+place.width/2,cy=place.top-b.top+place.height/2;
   return {layout:document.querySelector("#worldMap").dataset.layout,city:document.querySelectorAll(".city-district").length,places:board.querySelectorAll("button.island[data-place]").length,bots:board.querySelectorAll(".presence-dot--demo").length,self:board.querySelectorAll(".presence-dot--self").length,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2,dotAligned:Math.abs(parseFloat(dot.style.left)-cx)<3&&Math.abs(parseFloat(dot.style.top)-cy)<3,consent:window.NetizensWorldPresence.previewState(),media:getComputedStyle(document.querySelector(".city-art")).filter,cityWidth:b.width};
  });
  const modes=[];
  for(const layout of ["city","directory"]){
   await page.click('[data-world-layout="'+layout+'"]');
   await sleep(120);
   const layoutCheck=await page.evaluate(()=>{
    const board=document.querySelector("#placeWorld"),b=board.getBoundingClientRect(),self=board.querySelector(".presence-dot--self"),current=window.NetizensWorldPresence.previewState().currentPlace,btn=board.querySelector('.island[data-place="'+current+'"]' ).getBoundingClientRect();
    return {layout:document.querySelector("#worldMap").dataset.layout,pressed:document.querySelector('[data-world-layout="'+document.querySelector("#worldMap").dataset.layout+'"]').getAttribute("aria-pressed")==="true",allTargets:[...board.querySelectorAll('button.island[data-place]')].every(x=>{let r=x.getBoundingClientRect();return r.width>=44&&r.height>=44;}),selfAligned:Math.abs(parseFloat(self.style.left)-(btn.left-b.left+btn.width/2))<3,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
   });
   const ids=await page.$$eval("#placeWorld button.island[data-place]",els=>els.map(x=>x.dataset.place));
   let routes=0;
   for(const place of ids){
    await page.$eval('button.island[data-place="'+place+'"]',el=>el.focus());
    await page.keyboard.press("Enter");
    try {await page.waitForFunction(id=>document.querySelector("#placeView").classList.contains("active") && document.querySelector("#placeView").dataset.place===id,{timeout:6500},place);}catch(e){throw new Error(label+" "+layout+" "+place+" failed: "+e.message);}
    routes++;
    await page.click("#worldHome");
    await page.waitForSelector("#worldMap.active");
   }
   modes.push({layout,layoutCheck,routes});
  }
  await page.click('[data-world-layout="city"]');
  await sleep(120);
  // Click architecture, not a Place label: the city's original bridge/scene source routes it.
  await page.evaluate(()=>document.querySelector('.city-district[data-district="crews"] .city-building path[fill="url(#facade)"]')?.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  await page.waitForFunction(()=>document.querySelector("#placeView").classList.contains("active") && document.querySelector("#placeView").dataset.place==="crews",{timeout:6500});
  const architecturalRoute=await page.evaluate(()=>document.querySelector("#placeView").classList.contains("active")&&document.querySelector("#placeView").dataset.place==="crews");
  await page.click("#worldHome");
  await page.waitForSelector("#worldMap.active");
  // A user drag moves the camera but must not trigger a Place.
  const drag=await page.$eval(".world-scene-viewport",el=>({x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,w:el.getBoundingClientRect().width,oldLeft:el.scrollLeft}));
  await page.mouse.move(drag.x+drag.w/2,drag.y+38);
  await page.mouse.down();
  await page.mouse.move(drag.x+drag.w/2-105,drag.y+40,{steps:10});
  await page.mouse.up();
  const dragEnd=await page.$eval(".world-scene-viewport",el=>el.scrollLeft);
  const remainedMap=await page.$eval("#worldMap",el=>el.classList.contains("active"));
  if(!remainedMap)throw new Error(label+" drag navigated away from World map");
  // Local YES/NO is only a device choice, never fictional audience percentages.
  await page.click('[data-world-layout="directory"]');
  await page.$eval('button.island[data-place="yesno"]',el=>el.focus());
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.querySelector("#placeView").classList.contains("active") && document.querySelector("#placeView").dataset.place==="yesno",{timeout:6500});
  await page.click('[data-vote="yes"]');
  const vote=await page.$eval("#voteResult",el=>el.textContent);
  await page.reload({waitUntil:"domcontentloaded"});
  await page.click("#enterWorld");
  await page.click('[data-world-layout="directory"]');
  await page.$eval('button.island[data-place="yesno"]',el=>el.focus());
  await page.keyboard.press("Enter");
  await page.waitForFunction(()=>document.querySelector("#placeView").classList.contains("active") && document.querySelector("#placeView").dataset.place==="yesno",{timeout:6500});
  const restored=await page.$eval("#voteResult",el=>el.textContent);
  const analytics=await page.evaluate(()=>window.__analytics?.length??0);
  const pass=initial.layout==="city"&&initial.city===10&&initial.places===10&&initial.bots===4&&initial.self===1&&initial.dotAligned&&!initial.overflow&&modes.every(m=>m.routes===10&&m.layoutCheck.layout===m.layout&&m.layoutCheck.pressed&&m.layoutCheck.allTargets&&m.layoutCheck.selfAligned&&!m.layoutCheck.overflow)&&architecturalRoute&&remainedMap&&(width>=1000||Math.abs(dragEnd-drag.oldLeft)>2)&&vote.includes("Your YES choice")&&!vote.includes("%")&&restored.includes("Your YES choice")&&errors.length===0&&external.length===0;
  all=all&&pass;
  console.log(JSON.stringify({label,width,pass,initial:{layout:initial.layout,city:initial.city,places:initial.places,dots:initial.bots+initial.self,dotAligned:initial.dotAligned,overflow:initial.overflow,cityWidth:initial.cityWidth},modes,architecture:architecturalRoute,drag:{old:drag.oldLeft,new:dragEnd,remainedMap},vote,restored,analytics,errors,external}));
  await page.close();
 }
 const page=await browser.newPage();await page.emulateMediaFeatures([{name:"prefers-reduced-motion",value:"reduce"}]);await page.goto(url,{waitUntil:"domcontentloaded"});await page.click("#enterWorld");
 const a=await page.evaluate(()=>[...document.querySelectorAll(".presence-dot--demo")].map(x=>x.style.left+"|"+x.style.top));await sleep(1250);
 const b=await page.evaluate(()=>({dots:[...document.querySelectorAll(".presence-dot--demo")].map(x=>x.style.left+"|"+x.style.top),trans:getComputedStyle(document.querySelector(".presence-dot--demo")).transitionDuration,city:getComputedStyle(document.querySelector(".city-district")).transitionDuration}));
 const reduced=JSON.stringify(a)===JSON.stringify(b.dots)&&b.trans.split(",").every(x=>parseFloat(x)===0)&&b.city.split(",").every(x=>parseFloat(x)===0);
 console.log(JSON.stringify({label:"reduced-motion",pass:reduced,transition:b.trans,city:b.city}));all=all&&reduced;
 await page.close();await browser.close();process.exit(all?0:1);
})().catch(e=>{console.error(e.stack||e);process.exit(2)});
