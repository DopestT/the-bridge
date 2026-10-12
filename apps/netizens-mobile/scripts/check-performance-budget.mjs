import { readFileSync } from "node:fs";
import { budgets, checkBudget } from "../src/performance/metrics.ts";
if (!process.argv[2]) {
  console.error(
    "Supply a JSON file containing measured durations for every metric.",
  );
  process.exit(1);
}
const values = JSON.parse(readFileSync(process.argv[2], "utf8"));
let failed = false;
for (const [name, budget] of Object.entries(budgets)) {
  const pass = Array.isArray(values[name]) && checkBudget(values[name], budget);
  console.log(`${name}: ${pass ? "PASS" : "FAIL"} (p75 <= ${budget} ms)`);
  if (!pass) failed = true;
}
process.exitCode = failed ? 1 : 0;
