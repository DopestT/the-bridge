// Optional real-browser acceptance; requires an existing Playwright installation
// and installed Chrome. Serve this directory on localhost:4189 first.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT_DIR||'work/world-arrival-evidence';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try{
for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['small-phone',320,740],['tablet',768,1024],['small-desktop',1101,900],['wide-desktop',1920,1080]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[],external=[],resources=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>resources.push(r.url()));
 await page.route('**/*',r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}return r.continue();});
 const start=Date.now();await page.goto('http://127.0.0.1:4189');await page.locator('#enterWorld').click();
 await page.locator('.city-art').waitFor();await page.waitForTimeout(80);
 const entryMs=Date.now()-start;
 assert.equal(await page.locator('#worldMap').getAttribute('data-layout'),'city');
 await page.screenshot({path:path.join(out,`world-${name}.png`),fullPage:true});
 assert.equal(await page.locator('.city-art [data-district]').count(),10);
 assert.equal(await page.locator('#placeWorld button[data-place]').count(),10);
 assert.ok(!resources.some(r=>r.includes('approved-neon-world-reference')),'World must not use flattened reference image');
 const ids=await page.locator('#placeWorld button[data-place]').evaluateAll(bs=>bs.map(b=>b.dataset.place));
 for(const mode of ['city','directory']){
  await page.locator(`[data-world-layout="${mode}"]`).click();
  assert.equal(await page.locator(`[data-world-layout="${mode}"]`).getAttribute('aria-pressed'),'true');
  const boxes=await page.locator('#placeWorld button[data-place]').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {id:b.dataset.place,x:r.x,y:r.y,w:r.width,h:r.height};}));
  for(const r of boxes)assert.ok(r.w>=44&&r.h>=44,r.id+' touch target');
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,`${mode}: ${a.id}/${b.id} overlap`);}
  if(mode==='directory')await page.screenshot({path:path.join(out,`directory-${name}.png`),fullPage:true});
  for(const id of ids){
   const button=page.locator(`#placeWorld button[data-place="${id}"]`);await button.scrollIntoViewIfNeeded();await button.focus();await page.keyboard.press('Enter');
   await page.locator('#placeView.active').waitFor();assert.ok((await page.locator('#depthTrail').innerText()).toLowerCase().includes(id==='yesno'?'yes or no':id));
   assert.ok(!(await page.locator('#placeView').innerText()).includes('people active now'));await page.locator('#worldHome').click();
  }
 }
 // Hit the architecture itself, not a DOM label.
 await page.locator('[data-world-layout="city"]').click();
 await page.locator('.city-district[data-district="crews"] .city-building path[fill="url(#facade)"]').first().click();
 assert.match(await page.locator('#depthTrail').innerText(),/CREWS/);await page.locator('#worldHome').click();
 // A camera drag must not enter a district.
 const vp=page.locator('.world-scene-viewport');const r=await vp.boundingBox();
 const oldLeft=await vp.evaluate(e=>e.scrollLeft);const px=r.x+r.width*.5,py=r.y+35;
 await page.mouse.move(px,py);await page.mouse.down();await page.mouse.move(px-80,py+20,{steps:8});await page.mouse.up();
 assert.ok(await page.locator('#worldMap').evaluate(e=>e.classList.contains('active')),'Drag must not open a Place');
 if(width<1000)assert.notEqual(await vp.evaluate(e=>e.scrollLeft),oldLeft,'Phone camera should pan');
 // Genuine local state survives navigation and reload; never implies an audience.
 await page.locator('[data-world-layout="directory"]').click();await page.locator('[data-place="yesno"]').click();
 await page.locator('[data-vote="yes"]').click();assert.match(await page.locator('#voteResult').innerText(),/Your YES choice is saved on this device/);
 assert.ok(!(await page.locator('#voteResult').innerText()).includes('%'));
 await page.reload();await page.locator('#enterWorld').click();await page.locator('[data-world-layout="directory"]').click();await page.locator('[data-place="yesno"]').click();assert.match(await page.locator('#voteResult').innerText(),/Your YES choice/);
 await page.locator('#worldHome').click();await page.locator('[data-place="crews"]').click();await page.locator('#placeView [data-open-entity]').first().click();assert.ok(await page.locator('#depthTrail button').count()>=3);await page.locator('#depthTrail button').nth(1).click();await page.locator('#worldHome').click();
 await page.locator('#openCitizen').click();assert.equal(await page.locator('#citizenPanel').getAttribute('aria-hidden'),'false');await page.locator('[data-close-panel="citizenPanel"]').click();
 await page.locator('#openNotifications').click();assert.equal(await page.locator('#notificationPanel').getAttribute('aria-hidden'),'false');await page.locator('[data-close-panel="notificationPanel"]').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Document overflow');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 results.push({name,width,height,entryMs,districts:10,defaultCity:true,bothModesAllRoutes:true,keyboard:true,targetsAtLeast44:true,noOverlap:true,architectureClick:true,dragDoesNotNavigate:true,nestedNavigation:true,citizen:true,notifications:true,localVotePersists:true,noHorizontalDocumentOverflow:true,noReferenceImageRequest:true,pageErrors:errors});await context.close();
}
fs.writeFileSync(path.join(out,'browser-qa.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}
