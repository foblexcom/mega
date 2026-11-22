// Splits one merged ticket into the problems it hides, the way the desk counts them. Pages explain it;
// this file is what runs.
import { causeOf, groupByCause, readAs, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type ProblemRow = {
  problem: string;
  count: number;
  // Reports the desk read as a one-day move (desk-notes.json): counted here, where they are filed.
  oneDayMove: number;
  taggedAs: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

export function problemRows(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemRow[] {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket && causeOf(r, tenantOf(r)) !== null);
  return groupByCause(merged, tenantOf).map((g) => ({
    problem: g.cause,
    count: g.reports.length,
    oneDayMove: readAs(g, oneDayMove),
    taggedAs: g.taggedAs,
    tenants: g.tenants,
    firstSeen: g.firstSeen,
    lastSeen: g.lastSeen,
  }));
}
