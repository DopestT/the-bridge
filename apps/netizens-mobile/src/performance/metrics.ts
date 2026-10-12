export const budgets = {
  warm_resume_ms: 1000,
  cold_usable_ms: 2500,
  navigation_response_ms: 100,
  optimistic_ack_ms: 150,
  cached_entity_render_ms: 300,
};
export type MetricName = keyof typeof budgets;
export function measure(name: MetricName, start: number, end: number) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start)
    throw new Error("Invalid monotonic measurement");
  return { name, duration: end - start };
}
export function checkBudget(values: number[], budget: number) {
  if (!values.length || values.some((v) => !Number.isFinite(v) || v < 0))
    return false;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.75) - 1] <= budget;
}
const samples: { name: MetricName; duration: number }[] = [];
export function record(name: MetricName, start: number) {
  samples.push(measure(name, start, performance.now()));
  if (samples.length > 500) samples.shift();
}
export function measurements() {
  return [...samples];
}
