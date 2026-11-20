#!/usr/bin/env node
// Read-only superstar planning. Does not start any bots or touch production.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(here,"manifest.json"),"utf8"));
const roles=manifest.roles;
const ids=new Set(roles.map(r=>r.id));
if(ids.size!==5||roles.length!==5||manifest.status!=="defined_not_executing") throw new Error("Invalid five-superstar team");
if(manifest.executionOwner!=="Perception"||manifest.gates.liveExecutorVerified!==false)throw new Error("Unexpected execution authority");
for(const role of roles){
 if(!role.name||!role.mission||!role.acceptance||role.status!=="not_started")throw new Error("Invalid work order: "+role.id);
 if(role.dependsOn.some(id=>!ids.has(id)||id===role.id))throw new Error("Broken dependency: "+role.id);
}
const completed=new Set(),waves=[];
while(completed.size<roles.length){
 const eligible=roles.filter(r=>!completed.has(r.id)&&r.dependsOn.every(id=>completed.has(id))).slice(0,manifest.parallelismLimit);
 if(!eligible.length)throw new Error("Cyclic dependency");
 waves.push(eligible);for(const r of eligible)completed.add(r.id);
}
console.log(JSON.stringify({name:manifest.name,mode:"PLANNED_ONLY",activeRoles:roles.length,retiredLegacyRoles:38,
 actualWorkersRunning:"UNVERIFIED",verifiedCompletedJobs:0,maxParallel:manifest.parallelismLimit,
 waves:waves.map((wave,i)=>({wave:i+1,roles:wave.map(r=>r.id+" "+r.name)})),
 warning:"Planner produces only assignments; no models executed, branches changed, users contacted or outcomes verified."},null,2));
