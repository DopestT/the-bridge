import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('./city-scene.js',import.meta.url),'utf8');
const context=vm.createContext({});vm.runInContext(source,context);
const city=context.NetizensCity;
assert.equal(city.districts.length,10);
const html=fs.readFileSync(new URL('./index.html',import.meta.url),'utf8');
const routes=[...html.matchAll(/class="island [^"]+" data-place="([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(Array.from(city.districts,d=>d.id).sort(),routes.sort(),'Scene must correspond exactly to real Place buttons');
const a=city.render(),b=city.render();assert.equal(a,b,'Scene must be deterministic, with no simulated live activity');
assert.equal((a.match(/class="city-district"/g)||[]).length,10);
assert.ok(!/<image|<foreignObject|https?:\/\//.test(a.replace('http://www.w3.org/2000/svg','')),'City must render without screenshot textures, remote assets or embedded UI');
for(const d of city.districts){assert.ok(d.x-d.rx>0&&d.x+d.rx<city.width,d.id+' horizontal bounds');assert.ok(d.y+d.ry+100<city.height,d.id+' terrain bounds');}
assert.ok(a.length<400000,'Scene geometry should remain bounded');
console.log('NETIZENS city geometry, route parity, determinism and asset independence: PASS ('+a.length+' bytes)');
