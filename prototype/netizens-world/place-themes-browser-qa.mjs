import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT_DIR||'work/place-themes-evidence';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const [name,width,height] of [['desktop',1440,900],['phone',390,844],['small-phone',320,740]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();const errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}return r.continue();});
 await page.goto('http://127.0.0.1:4189');await page.locator('#enterWorld').click();await page.locator('[data-world-layout="directory"]').click();
 const places=await page.locator('#placeWorld button[data-place]').evaluateAll(bs=>bs.map(b=>b.dataset.place));const identities=[];
 for(const id of places){
  await page.locator(`#placeWorld button[data-place="${id}"]`).click();await page.locator('#placeView.active').waitFor();assert.equal(await page.locator('#placeView').getAttribute('data-place-theme'),id);assert.equal(await page.locator('#placeView').getAttribute('data-view'),'place');
  identities.push(await page.locator('#placeView').evaluate(e=>getComputedStyle(e).background));
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,`${id}-${name}.png`),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' page overflow');
  if(id==='yesno'){
   await page.locator('[data-vote="yes"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-vote="yes"]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-vote="no"]').getAttribute('aria-pressed'),'false');assert.match(await page.locator('#voteResult').innerText(),/Your YES choice/);assert.ok(!(await page.locator('#voteResult').innerText()).includes('%'));
   for(const b of await page.locator('[data-vote]').all()){const r=await b.boundingBox();assert.ok(r.width>=44&&r.height>=44);}
   await page.screenshot({path:path.join(out,`yesno-selected-${name}.png`),fullPage:true});
   await page.locator('[data-vote="no"]').click();assert.equal(await page.locator('[data-vote="no"]').getAttribute('aria-pressed'),'true');
  }
  const entity=page.locator('#placeView .entity-card').first();
  if(await entity.count()){
   await entity.click();assert.equal(await page.locator('#placeView').getAttribute('data-place-theme'),id);assert.equal(await page.locator('#placeView').getAttribute('data-view'),'entity');assert.ok(await page.locator('#depthTrail button').count()>=3);await page.locator('#depthTrail button').nth(1).click();
  }
  if(id==='plans'){
   assert.ok(await page.locator('#planTitle').count());await page.locator('#planTitle').fill('Plan theme acceptance');await page.locator('[data-create-plan]').click();await page.locator('.entity-card').filter({hasText:'Plan theme acceptance'}).click();await page.locator('[data-discussion-body]').fill('A note in the new paper theme.');await page.locator('[data-discussion-compose]').click();assert.match(await page.locator('.entity-participation').innerText(),/A note in the new paper theme/);
  }
  await page.locator('#worldHome').click();
 }
 assert.equal(new Set(identities).size,10,'Every section must actually receive its own visual identity');
 await page.reload();await page.locator('#enterWorld').click();await page.locator('[data-world-layout="directory"]').click();await page.locator('[data-place="yesno"]').click();assert.equal(await page.locator('[data-vote="no"]').getAttribute('aria-pressed'),'true');assert.match(await page.locator('#voteResult').innerText(),/Your NO choice/);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({name,width,height,places:10,distinctBackgrounds:10,noOverflow:true,nestedThemePreserved:true,localPlanAndDiscussion:true,keyboardVoting:true,selectedChoiceAccessible:true,votePersists:true,pageErrors:errors});await context.close();
}fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));}finally{await browser.close();}
