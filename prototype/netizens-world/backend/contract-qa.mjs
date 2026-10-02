import fs from "node:fs";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const sql=fs.readFileSync(new URL("./schema.sql",import.meta.url),"utf8");
const stateSchema=JSON.parse(fs.readFileSync(new URL("./world-state.schema.json",import.meta.url),"utf8"));
const app=fs.readFileSync(new URL("../app.js",import.meta.url),"utf8");

const places=["commons","crews","local","projects","ask","exchange","circles","events","plans","yesno"];

for(const place of places){
  assert.ok(app.includes(place+':{') || app.includes(place+': {'),"UI place missing: "+place);
  assert.ok(sql.includes("('"+place+"'"),"DB place missing: "+place);
}

for(const table of [
  "citizens","places","world_entities","entity_memberships","netizens_access_grants",
  "netizens_perception_bindings","time_machine_scenarios","world_audit_events"
]){
  assert.ok(new RegExp("create table if not exists\\s+"+table+"\\s*\\(","i").test(sql),"Required table missing: "+table);
}

for(const duplicate of ["create table if not exists perception_objectives","create table if not exists perception_routes","create table if not exists execution_steps","create table if not exists verification_events"]){
  assert.ok(!sql.toLowerCase().includes(duplicate),"NETIZENS must not duplicate canonical Perception table: "+duplicate);
}

assert.ok(sql.includes("perception_project_id"),"Perception bridge should persist canonical project IDs");
assert.ok(sql.includes("perception_objective_id"),"Perception bridge should persist canonical objective IDs");
assert.ok(sql.includes("perception_route_id"),"Perception bridge should persist canonical route IDs");

assert.equal(stateSchema.type,"object");
assert.ok(stateSchema.required.includes("citizen"));
assert.ok(stateSchema.required.includes("world"));
assert.deepEqual(stateSchema.properties.citizen.properties.form.enum,["likeness","stylized","fictional","privacy"]);

console.log("NETIZENS backend contract QA passed");
