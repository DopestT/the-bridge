import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT_DIR||'work/suggestions-evidence';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const [name,width,height] of [['desktop',1440,900],['phone',390,844]]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});const page=await context.newPage();const errors=[],external=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{if(new URL(r.request().url()).hostname!=='127.0.0.1'){external.push(r.request().url());return r.abort();}return r.continue();});
 await page.goto('http://127.0.0.1:4189');await page.locator('#enterWorld').click();await page.locator('[data-world-layout="directory"]').click();await page.locator('[data-place="commons"]').click();await page.locator('[data-perception-from="commons"]').click();await page.locator('#routeIntent').click();
 const result=page.locator('#routeResult');await result.getByRole('heading',{name:'Take a next step'}).waitFor();
 assert.doesNotMatch(await result.innerText(),/SUPERSTARS|SPECIALISTS PROPOSED|NET-STAR|World Architect|Release Captain/);
 assert.match(await result.innerText(),/Nothing has been run or shared/);
 await page.screenshot({path:path.join(out,`perception-${name}.png`),fullPage:true});
 await result.locator('[data-save-route]').click();assert.match(await result.locator('[data-save-route]').innerText(),/saved on this device/);
 await result.locator('[data-open-route="crews"]').last().click();assert.equal(await page.locator('#perceptionPanel').getAttribute('aria-hidden'),'true');assert.match(await page.locator('#depthTrail').innerText(),/CREWS/);
 await page.locator('[data-perception-from="crews"]').click();await page.locator('#routeIntent').click();await result.locator('[data-start-plan]').click();assert.equal(await page.locator('#perceptionPanel').getAttribute('aria-hidden'),'true');assert.ok(await page.locator('#planTitle').evaluate(e=>e===document.activeElement));
 const title=`Useful local plan ${name}`;await page.locator('#planTitle').fill(title);await page.locator('[data-create-plan]').click();await page.locator('.entity-card').filter({hasText:title}).click();await page.locator('[data-discussion-body]').fill('A real note entered in this isolated local browser test.');await page.locator('[data-discussion-compose]').click();assert.match(await page.locator('.entity-participation').innerText(),/A real note entered/);
 await page.reload();await page.locator('#enterWorld').click();await page.locator('[data-world-layout="directory"]').click();await page.locator('[data-place="plans"]').click();await page.locator('.entity-card').filter({hasText:title}).click();assert.match(await page.locator('.entity-participation').innerText(),/A real note entered/);
 // Also verify the connected routing response cannot inject the internal roster.
 await page.route('http://127.0.0.1:4189/test-perception',r=>r.fulfill({json:{ok:true,project_id:'test-project',objective_id:'test-objective',route_id:'test-route',route_plan:{reason:'A mocked connected route.',nodes:[{key:'discover',label:'Explore groups',outcome:'Find a group',capability:'retrieve',permissionLevel:'P0',risk:'low'}]}}}));
 await page.evaluate(()=>window.NetizensPerception.configure({endpoint:'http://127.0.0.1:4189/test-perception',accessToken:'test-only'}));
 await page.locator('[data-perception-entity]').click();await page.locator('#routeIntent').click();await result.locator('.live-route').waitFor();assert.doesNotMatch(await result.innerText(),/SPECIALISTS PROPOSED|NET-STAR|World Architect/);assert.equal(await result.locator('[data-start-plan]').count(),1);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);results.push({name,width,height,exactCommonsRepro:true,noSpecialistRoster:true,openGroups:true,startPlanFocus:true,createPlanAndPost:true,persistsAfterReload:true,saveSuggestions:true,mockedConnectedRoute:true,pageErrors:errors});await context.close();
}fs.writeFileSync(path.join(out,'qa.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));}finally{await browser.close();}
