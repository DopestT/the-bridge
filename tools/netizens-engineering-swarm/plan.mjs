#!/usr/bin/env node
// Read-only validation and launch-order preview. Does not run models or mutate code.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(here,"manifest.json"),"utf8"));
const roles=manifest.roles;
const ids=new Set(roles.map(r=>r.id));
if(ids.size!==roles.length || roles.length<20) throw new Error("Duplicate or missing specialist roles");
for(const role of roles){
  if(!role.name||!role.mission||!role.acceptance||role.status!=="not_started")throw new Error("Invalid work order: "+role.id);
  if(role.dependsOn.some(id=>!ids.has(id)||id===role.id))throw new Error("Broken dependency: "+role.id);
}
const completed=new Set(), waves=[];
while(completed.size<roles.length){
  const eligible=roles.filter(r=>!completed.has(r.id)&&r.dependsOn.every(id=>completed.has(id))).slice(0,manifest.parallelismLimit);
  if(!eligible.length)throw new Error("Cyclic dependency");
  waves.push(eligible);for(const r of eligible)completed.add(r.id);
}
console.log(JSON.stringify({name:manifest.name,mode:"PLANNED_ONLY",workers:roles.length,maxParallel:manifest.parallelismLimit,waves:waves.map((wave,i)=>({wave:i+1,roles:wave.map(r=>r.id+" "+r.name)})),warning:"No API calls, agents, issue changes, code edits, builds, deployments, real-phone tests or completed outcomes were executed by this planner."},null,2));
