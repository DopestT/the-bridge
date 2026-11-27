const p=require('puppeteer');
(async()=>{
 const browser=await p.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox','--no-proxy-server','--proxy-bypass-list=*']});
 const outcomes=[];let all=true;
 for(const width of [1440,390,360]){
  const page=await browser.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(!req.url().startsWith(new URL(process.env.NETIZENS_WORLD_PREVIEW_URL || 'http://127.0.0.1:4197/prototype/netizens-world/index.html').origin))requests.push(req.url())});
  await page.setViewport({width,height:width>600?900:844});
  await page.goto(process.env.NETIZENS_WORLD_PREVIEW_URL || 'http://127.0.0.1:4197/prototype/netizens-world/index.html',{waitUntil:'domcontentloaded',timeout:18000});
  await page.evaluate(()=>{window.__movementEvents=[];window.addEventListener('netizens:analytics',e=>window.__movementEvents.push(e.detail.event));});
  await page.click('#enterWorld');
  const start=await page.evaluate(()=>({preview:window.NetizensWorldPresence.previewState(),dots:document.querySelectorAll('.presence-dot').length,self:document.querySelectorAll('.presence-dot--self').length,demo:document.querySelectorAll('.presence-dot--demo').length,disabled:document.querySelector('#presenceFollow').disabled,status:document.querySelector('#worldPresenceStatus').textContent,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2}));
  await page.click('.island[data-place="projects"]');
  await page.waitForFunction(()=>window.NetizensWorldPresence.previewState().currentPlace==='projects' && document.querySelector('#placeView').classList.contains('active'),{timeout:10000});
  const arrived=await page.evaluate(()=>({place:window.NetizensWorldPresence.previewState().currentPlace,events:window.__movementEvents.slice()}));
  await page.click('#worldHome');
  const returnMap=await page.evaluate(()=>({dot:document.querySelector('.presence-dot')?.dataset.worldPlace,map:document.querySelector('#worldMap').classList.contains('active')}));
  await page.click('#openCitizen');
  await page.$eval('#presenceIdentity',el=>el.click());
  await page.$eval('#presenceFollow',el=>el.click());
  const shared=await page.evaluate(()=>window.NetizensWorldPresence.previewState());
  await page.$eval('#presenceIdentity',el=>el.click());
  const hiddenAgain=await page.evaluate(()=>window.NetizensWorldPresence.previewState());
  await page.reload({waitUntil:'domcontentloaded'});
  const persistedOff=await page.evaluate(()=>window.NetizensWorldPresence.previewState());
  const pass=start.dots===5&&start.self===1&&start.demo===4&&start.preview.demoBotCount===4&&!start.preview.identityVisible&&!start.preview.followMovement&&start.disabled&&start.status.includes('SIMULATED DOT BOTS')&&start.status.includes('NO LIVE MEMBERS')&&!start.overflow&&arrived.place==='projects'&&!arrived.events.includes('place_view')&&returnMap.dot==='projects'&&returnMap.map&&shared.identityVisible&&shared.followMovement&&!hiddenAgain.identityVisible&&!hiddenAgain.followMovement&&!persistedOff.identityVisible&&!persistedOff.followMovement&&errors.length===0&&requests.length===0;
  outcomes.push({width,pass,start,arrived,returnMap,shared,hiddenAgain,persistedOff,errors,externalRequests:requests});
  all&&=pass;
  console.log('BROWSER',JSON.stringify(outcomes[outcomes.length-1]));
  await page.close();
 }
 await browser.close();
 process.exit(all?0:1);
})().catch(e=>{console.error(e.stack||e);process.exit(2)})