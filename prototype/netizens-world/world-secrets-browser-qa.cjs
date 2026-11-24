const p=require('puppeteer');
(async()=>{
 const browser=await p.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--no-sandbox','--no-proxy-server','--proxy-bypass-list=*']});
 let all=true;
 const url='http://127.0.0.1:4197/prototype/netizens-world/index.html';
 const places=['commons','crews','local','projects','ask','exchange','circles','events','plans','yesno'];
 for(const width of [1440,390,360]){
  const page=await browser.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(!r.url().startsWith(new URL(url).origin))external.push(r.url())});
  await page.setViewport({width,height:width>600?900:844});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:18000});
  await page.evaluate(()=>{localStorage.removeItem('netizens_world_found_signals_v1');localStorage.removeItem('netizens_world_presence_privacy_v1')});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.click('#enterWorld');
  let initial=await page.evaluate(()=>({
   bots:document.querySelectorAll('.presence-dot--demo').length,
   self:document.querySelectorAll('.presence-dot--self').length,
   labels:[...document.querySelectorAll('.presence-dot--demo')].every(el=>el.dataset.demo==='true'),
   title:document.querySelector('#worldPresenceStatus')?.textContent,
   active:window.NetizensWorldPresence.previewState(),
   overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2
  }));
  await page.waitForTimeout?.(2500);
  if(!page.waitForTimeout)await new Promise(ok=>setTimeout(ok,2500));
  const motion=await page.evaluate(()=>[...document.querySelectorAll('.presence-dot--demo')].map(el=>({place:el.dataset.worldPlace,opacity:getComputedStyle(el).opacity,left:el.style.left,top:el.style.top})));
  const discover=width===1440?places:['commons','projects'];
  const results=[];
  for(const place of discover){
   await page.click('.island[data-place="'+place+'"]');
   await page.waitForFunction(id=>document.querySelector('#placeView').classList.contains('active')&&window.NetizensWorldPresence.previewState().currentPlace===id,{timeout:8000},place);
   const onPlace=await page.evaluate(()=>({
    room:window.NetizensWorldPresence.previewState().currentPlace,
    bots:document.querySelectorAll('.presence-dot--demo').length,
    trigger:!!document.querySelector('.world-secret-trigger')
   }));
   await page.click('[data-secret-place="'+place+'"]');
   const secret=await page.evaluate(()=>({
    dialog:document.querySelector('#worldSecretDialog').open,
    title:document.querySelector('#worldSecretTitle').textContent,
    count:window.NetizensWorldSecrets.previewState().foundCount,
    constellation:document.querySelector('#worldSecretEpilogue').textContent.includes('A CONSTELLATION FORMS')
   }));
   await page.keyboard.press('Escape');
   const closed=await page.evaluate(()=>!document.querySelector('#worldSecretDialog').open);
   results.push({place,onPlace,secret,closed});
   await page.click('#worldHome');
   await page.waitForSelector('#worldMap.active');
  }
  let unlock=await page.evaluate(()=>({
   count:window.NetizensWorldSecrets.previewState().foundCount,
   total:window.NetizensWorldSecrets.previewState().total,
   botCount:window.NetizensWorldPresence.previewState().demoBotCount,
   identityOff:!window.NetizensWorldPresence.previewState().identityVisible,
   noFollow:!window.NetizensWorldPresence.previewState().followMovement,
   status:document.querySelector('#worldPresenceStatus').textContent
  }));
  if(width===1440){
   unlock.constellation=results.find(x=>x.place==='yesno')?.secret.constellation === true;
   await page.reload({waitUntil:'domcontentloaded'});
   unlock.savedAfterReload=await page.evaluate(()=>window.NetizensWorldSecrets.previewState().foundCount);
  }
  const passed=initial.bots===4&&initial.self===1&&initial.labels&&!initial.overflow&&initial.title.includes('SIMULATED')&&initial.active.livePresenceConnected===false&&motion.length===4&&motion.some(x=>x.place!=='crews'&&x.place!=='local'&&x.place!=='events'&&x.place!=='projects')&&results.every(x=>x.onPlace.trigger&&x.onPlace.bots===0&&x.secret.dialog&&x.closed&&!!x.secret.title)&&unlock.count===discover.length&&unlock.botCount===4&&unlock.identityOff&&unlock.noFollow&&(width!==1440||(unlock.constellation&&unlock.savedAfterReload===10))&&errors.length===0&&external.length===0;
  all&&=passed;
  console.log(JSON.stringify({width,passed,initial,motion,results,unlock,errors,external}));
  await page.close();
 }
 await browser.close();process.exit(all?0:1);
})().catch(e=>{console.error(e.stack||String(e));process.exit(2)})
