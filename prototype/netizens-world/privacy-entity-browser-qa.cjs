const puppeteer=require("puppeteer");
const url=process.env.NETIZENS_WORLD_PREVIEW_URL||"http://127.0.0.1:4197/prototype/netizens-world/index.html";
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",args:["--no-sandbox","--no-proxy-server","--proxy-bypass-list=*"]});
 const page=await browser.newPage(),errors=[],external=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(!r.url().startsWith(new URL(url).origin))external.push(r.url())});
 await page.goto(url,{waitUntil:"domcontentloaded"});
 await page.evaluate(()=>{
  window.__analytics=[];
  window.__uiEvents=[];
  window.addEventListener("netizens:analytics",e=>window.__analytics.push(e.detail));
  window.addEventListener("netizens:entity-view",e=>window.__uiEvents.push(e.detail));
 });
 await page.click("#enterWorld");
 await page.click('.island[data-place="projects"]');
 await page.waitForSelector("#placeView.active",{timeout:6000});
 const entityCount=await page.$$eval(".entity-card",els=>els.length);
 if(entityCount<1)throw new Error("No local demonstration entity");
 await page.click(".entity-card");
 await page.waitForSelector(".entity-participation .entity-discussion",{timeout:6000});
 const state=await page.evaluate(()=>({
  room:document.querySelector("#placeView h1")?.textContent,
  discussions:document.querySelectorAll(".entity-participation .discussion-composer").length,
  localUIEvents:window.__uiEvents.length,
  analytics:window.__analytics.length,
  consent:window.NetizensWorldPresence.previewState(),
  overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
 }));
 const pass=entityCount>0&&state.discussions===1&&state.localUIEvents===1&&state.analytics===0&&!state.consent.identityVisible&&!state.consent.followMovement&&!state.overflow&&errors.length===0&&external.length===0;
 console.log(JSON.stringify({pass,entityCount,state,errors,external}));
 await browser.close();process.exit(pass?0:1);
})().catch(e=>{console.error(e.stack||e);process.exit(2)})
