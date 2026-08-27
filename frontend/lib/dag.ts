import type { Step } from "./types";

export function topoSortSteps(steps: Step[]): Step[] {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const includedIds = new Set(steps.map((s) => s.id));
  const ordered: Step[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function visit(id: string): void {
    if (visited.has(id) || inStack.has(id)) return;
    const step = byId.get(id);
    if (!step) return;
    inStack.add(id);
    for (const dep of step.depends_on) {
      if (includedIds.has(dep)) visit(dep);
    }
    inStack.delete(id);
    visited.add(id);
    ordered.push(step);
  }

  for (const s of steps) visit(s.id);
  return ordered;
}

export function isStepReady(step: Step, doneMap: Record<string, boolean>): boolean {
  if (step.depends_on.length === 0) return true;
  return step.depends_on.every((dep) => doneMap[dep]);
}
